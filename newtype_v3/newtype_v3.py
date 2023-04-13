import logging
from pathlib import Path
from typing import List, Tuple

import gradio as gr

from modules import call_queue
from modules import scripts, script_callbacks
from modules.script_callbacks import ImageSaveParams

from newtype_v3.locs import DEFAULT_LOC
from .users import create_user
from .images import (
    create_image, create_image_from_string, create_image_to_image_file
)


logger = logging.getLogger(__name__)

loaded_count = 0

base_dir = Path(scripts.basedir())
all_btns: List[Tuple[gr.Button, ...]] = []

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
        if isinstance(component, gr.HTML):
            if component.elem_id in {'html_info_txt2img'}:
                with open(f'{DEFAULT_LOC}/html/potd.html') as f:
                    gr.HTML(
                        f.read(), 
                        elem_id="best-product-tab", 
                    )

        if isinstance(component, gr.Gallery):
            if component.elem_id in {'txt2img_gallery'}:
                with gr.Accordion('Feed Settings', open=True):
                    with gr.Column():
                        with gr.Row():
                            save = gr.Button(
                                'Share', elem_id='save_txt2_image'
                            )
                            with open(f'{DEFAULT_LOC}/html/profile.html') as f:
                                gr.HTML(f.read(), elem_id="feed-profile-tab")
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

