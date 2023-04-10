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
                        <div class="potd">
                            👑 POTD 👑
                        </div>
                        <div class="product-slider" v-if="bestFeeds.length > 0">
                            <div class="pinterest-gallery">
                                <template v-for="(imageData, j) in bestFeeds" :key="j">
                                <div class="pinterest-item">
                                        <img :src="imageData.url" @click="openModal(imageData)">
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
                        <template v-if="showModal">
                            <div class="prompt-modal">
                                <div class="prompt-modal-content">
                                    <div style="display:flex;justify-content:end;">
                                        <span @click="close" class="prompt-modal-close">&times;</span>
                                    </div>
                                    <img :src="src" alt="Pretty Image">
                                    <table class="prompt-modal-table">
                                        <tr>
                                            <td>Model</td>
                                            <td>{{metadata.sd_model}}</td>
                                        </tr>
                                        <tr>
                                            <td>Prompt</td>
                                            <td>{{metadata.prompt}}</td>
                                        </tr>
                                        <tr>
                                            <td>Negative Prompt</td>
                                            <td>{{metadata.negative_prompt}}</td>
                                        </tr>
                                        <tr>
                                            <td>N iters</td>
                                            <td>{{metadata.n_iter}}</td>
                                        </tr>
                                        <tr>
                                            <td>Cfg Scales</td>
                                            <td>{{metadata.cfg_scale}}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </template>
                    '''
                gr.HTML(
                    view_html, 
                    elem_id="best-product-tab", 
                )

        if isinstance(component, gr.Gallery):
            if component.elem_id in {'txt2img_gallery'}:
                with gr.Accordion('Feed Settings', open=True):
                    with gr.Column():
                        share_image_checkbox = gr.Checkbox(
                            label='Always share image', value=share_image, 
                            visible=True
                        )
                        share_image_checkbox.change(
                            set_share_image, 
                            inputs=[share_image_checkbox], 
                            outputs=[]
                        )
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

