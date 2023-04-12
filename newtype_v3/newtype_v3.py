import logging
from pathlib import Path
from typing import List, Tuple

import gradio as gr

from modules import call_queue
from modules import scripts, script_callbacks
from modules.script_callbacks import ImageSaveParams
from .users import create_user
from .images import (
    create_image, create_image_from_string, create_image_to_image_file
)


logger = logging.getLogger(__name__)

loaded_count = 0

base_dir = Path(scripts.basedir())
all_btns: List[Tuple[gr.Button, ...]] = []
share_image: bool = False


def set_share_image(x):
    global share_image
    share_image = x


def save_files(image_file: str, outer_html) -> List[str]:
    userId = create_user()
    result = create_image_from_string(
        image_file,
        userId,
    )
    result_string = "Success" if result else "Failed"
    return [
        result_string
    ]


def save_imgto_img_file(
    image_file: str, original_img_string: str, outer_html: str
):
    userId = create_user()
    result = create_image_to_image_file(
        image_file,
        original_img_string,
        userId
    )
    result_string = "Success" if result else "Failed"
    return [result_string]


def register_png_posturl() -> None:
    def on_img_save_url(image_save_params: ImageSaveParams) -> None:
        try:
            global share_image
            if share_image:
                userId = create_user()
                create_image(
                    image_save_params.image, 
                    userId,
                    image_save_params.p,
                    info=image_save_params.pnginfo.get("parameters") if image_save_params.pnginfo else None
                )
        except Exception:
            logger.exception("Error save data")
    script_callbacks.on_image_saved(on_img_save_url)


class Script(scripts.Script):
    def __init__(self):
        global loaded_count

        loaded_count += 1

        # This is a hack to make sure that the script is only loaded once
        # Auto1111 calls the script twice, once for the txt2img and once for 
        # img2img
        # These callbacks should only be registered once.

        # When the Reload UI button in the settings tab is pressed, the script 
        # is loaded twice again
        # Therefore we only register callbacks every second time the script is 
        # loaded
        if loaded_count % 2 == 0:
            return
        register_png_posturl()

    def title(self):
        return "Feed"

    def show(self, is_img2img):
        return scripts.AlwaysVisible

    def process(
        self,
        p,
        *args,
        **kwargs
    ):
        return p

    def after_component(self, component, **kwargs):
        global share_image
        if isinstance(component, gr.HTML):
            if component.elem_id in {'html_info_txt2img'}:
                view_html = '''
                <div>
                        <div class="potd">
                            👑 POTD 👑
                        </div>
                        <div class="product-slider" v-if="bestFeeds.length > 0">
                            <div class="pinterest-gallery">
                                <template v-for="(imageData, j) in bestFeeds" :key="j">
                                    <div class="pinterest-item">
                                        <button @click="openModal(imageData)">
                                            <img :src="imageData.url">
                                        </button>
                                        <div class="item-overlay">
                                            <template v-if="!imageData.liked">
                                                <div class="liked-button-div not-liked-div" @click="addToWishList(imageData)">
                                                    <button class="like-button">👍 {{formatNumber(imageData.likecount)}}</button>
                                                </div>
                                            </template>
                                            <template v-else>
                                                <div class="liked-button-div already-liked-div" @click="deleteWishList(imageData)">
                                                    <button class="like-button already-liked-button">👍 {{formatNumber(imageData.likecount)}}</button>
                                                </div>
                                            </template>
                                            <p class="item-author">by {{imageData.nickname}}</p>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                        <div class="prompt-modal" v-if="showModal">
                            <div class="prompt-modal-page">
                                <div class="prompt-modal-image">
                                    <img :src="src" alt="Pretty Image"/>
                                </div>
                                <div class="prompt-modal-sidebar">
                                    <div class="modal-sidebar-header">
                                        <div style="display:flex;">
                                            <div class="modal-like-wrapper">
                                                <template v-if="!currentItem.liked">
                                                    <div class="big-liked-button-div not-liked-div" @click="addToWishList(currentItem)">
                                                        <button class="like-button">👍 {{formatNumber(currentItem.likecount)}}</button>
                                                    </div>
                                                </template>
                                                <template v-else>
                                                    <div class="big-liked-button-div already-liked-div" @click="deleteWishList(currentItem)">
                                                        <button class="like-button already-liked-button">👍 {{formatNumber(currentItem.likecount)}}</button>
                                                    </div>
                                                </template>
                                            </div>
                                            <div class="modal-writer-wrappers">
                                                <div class="modal-writer">By {{currentItem.nickname}}</div>
                                                <div class="modal-writer-time">{{currentItem.created_at}}</div>
                                            </div>
                                        </div>
                                        <div class="modal-writer-wrapper-exit" @click="close()">
                                            <div>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none">
                                                <path d="M19.9037 17.8831L27.752 25.7314V27.7998H25.6837L17.8354 19.9514L9.98703 27.7998H7.9187V25.7314L15.767 17.8831L7.9187 10.0348V7.96643H9.98703L17.8354 15.8148L25.6837 7.96643H27.752V10.0348L19.9037 17.8831Z" fill="white"/>
                                                <rect x="1.32679" y="1.37439" width="33.0173" height="33.0173" rx="4.50866" stroke="#0E0E0E" stroke-width="0.982675"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="modal-write-input-wrapper">
                                        <div class="modal-write-input-div">
                                            <textarea v-model="comment" @input="handleTextareaInput" class="modal-writer-type" @focus="makeSaveButtonVisible" placeholder="Type your comment"></textarea>
                                        </div>
                                        <div style="display:flex;justify-content:center;width:100%;">
                                            <div v-if="showCommentWrite" class="write-row-button">
                                                <button class="btn-write-row btn-cancel" @click="hideSaveButtonVisible">Cancel</button>
                                                <button class="btn-write-row btn-save" @click="writeComment()">Comment</button>
    /                                         </div>
                                        </div>
                                    </div>
                                    <div style="margin-top:10px;border-bottom: 1px solid #AFB6BD;padding-bottom:17px;">
                                        <template v-for="(commentData, j) in comments" :key="j">
                                            <div style="margin-left:10px;margin-right:10px;">
                                                <div style="display:flex;width:100%;margin-bottom:12px;color:white;">
                                                    <div style="margin-right:10px;color:white;font-size:17px;font-weight:700;">{{commentData.user.nickname}}</div>
                                                    <div style="color:white;font-size:12px;font-weight:300;">{{commentData.created_at}}</div>
                                                </div>
                                                <div style="display:flex;width:100%;color:white;">
                                                    <div style="color:white;font-size:13px;">{{commentData.text}}</div>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                    <div class="prompt-send-to">
                                        <button class="btn-send-to btn-send-to-text" @click="this.sendToTextToImage()">Send to t2i</button>
                                        <button class="btn-send-to btn-send-to-img" @click="this.sendToImageToImage()">Send to i2i</button>
                                    </div>
                                    <div style="margin-top:12px;">
                                        <div style="margin-left: 10px;margin-right: 10px;">
                                            <div style="color:white;margin-bottom:12px;">Generation Data</div>
                                            <div style="box-sizing: border-box;display: flex;flex-direction: column;justify-content: center;align-items: flex-start;padding-left:20px;padding-right:20px;padding-top:10px;padding-bottom:10px;border: 1px solid #AFB6BD;border-radius: 5px;color:white;">
                                                <template v-for="(value, key) in metadata">
                                                    <template v-if="/^[A-Z]/.test(key)">
                                                        {{key}}:{{value}},
                                                    </template>
                                                </template>
                                            </div>
                                            <div style="display:flex;justify-content:center;margin-top:20px;">
                                                <button @click="copyClipboard" style="text-align:center;box-sizing: border-box;display: flex;flex-direction: column;justify-content: center;align-items: flex-start;padding-top:10px;padding-bottom:10px;border: 1px solid #AFB6BD;border-radius: 5px;color:white;width:100%;">
                                                <div style="color:white;margin:auto;">Copy Generation Data</div></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    '''
                gr.HTML(
                    view_html, 
                    elem_id="best-product-tab", 
                )

        if isinstance(component, gr.Gallery):
            if component.elem_id in {'txt2img_gallery'}:
                with gr.Accordion('Feed Settings', open=True):
                    with gr.Column():
                        view_html = '''
                            <template v-if="!editMode">
                                <div style="display:flex;align-items:center;">
                                    <div style="padding: 10px; border-radius: 5px; display:flex;align-items:center;">
                                        <p style="line-height:normal;line-height:0;font-size: 25px;font-weight: 800;margin-right: 10px;">By.</p>
                                        <p style="line-height: 0;font-size: 20px;margin-right: 10p;">{{nickname}}</p>
                                    </div>
                                    <button @click="setEditMode" style="width:24px;height:24px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>
                                </div>
                            </template>
                            <template v-else>
                                <input  style="padding: 10px; border-radius: 5px; border: 1px solid #ccc; flex-grow: 1;" type="text" v-model="nickname">
                                <button  style="width:24px;height:24px;margin-right:15px;margin-left:15px;" @click="saveNickname">💾</button>
                                <button style="width:24px;height:24px;" @click="setEditMode">
                                    ✖️
                                </button>
                            </template>
                        '''
                        with gr.Row():
                            save = gr.Button(
                                'Share', elem_id='save_txt2_image'
                            )
                            gr.HTML(view_html, elem_id="feed-profile-tab")
                        # JS에서 브라우저에있는데이터를 save_files함수로 전송
                        js_string = """(a)=>{
                            const el = gradioApp().querySelector('#txt2img_gallery');
                            const imgList = el.getElementsByTagName('img');
                            const htmlInfoTxtImg = gradioApp().querySelector('#html_info_txt2img');
                            return [imgList[0]['src'], htmlInfoTxtImg.outerHTML];
                        }"""
                        txt_to_txt_result = gr.Textbox(
                            "",
                            label="",
                            visible=True
                        )
                        save.click(
                            fn=call_queue.wrap_gradio_call(save_files),
                            _js=js_string,
                            inputs=[save, save],
                            outputs=[txt_to_txt_result],
                            show_progress=True,
                        )

            if component.elem_id in {'img2img_gallery'}:
                with gr.Accordion('Feed Settings', open=True):
                    with gr.Column():
                        save = gr.Button('Share', elem_id='save_img2_image')
                        img_to_img_result = gr.Textbox(
                            "",
                            label="",
                            visible=True
                        )
                        # JS에서 브라우저에있는데이터를 save_files함수로 전송
                        js_string = """(a)=>{
                            const el = gradioApp().querySelector('#img2img_gallery');
                            const elOrigin = gradioApp().querySelector("#img2img_image");
                            const imgList = el.getElementsByTagName('img');
                            const originImgList = elOrigin.getElementsByTagName('img');
                            const htmlInfoTxtImg = gradioApp().querySelector('#html_info_img2img');
                            return [imgList[0]['src'], originImgList[0]['src'], htmlInfoTxtImg.outerHTML];
                        }"""
                        save.click(
                            fn=call_queue.wrap_gradio_call(
                                save_imgto_img_file
                            ),
                            _js=js_string,
                            inputs=[save, save, save],
                            outputs=[
                                img_to_img_result
                            ],
                            show_progress=True,
                        )

    def ui(self, is_img2img):
        return []

