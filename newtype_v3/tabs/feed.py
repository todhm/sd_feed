import gradio as gr

from newtype_v3.users import create_user
from newtype_v3.locs import DEFAULT_LOC


def on_ui_tabs():
    user_dict = create_user()
    userId = user_dict.get("userId")
    token = user_dict.get("token")
    script_html = f"""
        <script>window.localStorage.setItem("userId", "{userId}");</script>
        <script>window.localStorage.setItem("userToken", "{token}");</script>
    """
    iframe_html = (
        f"""<iframe style="width: 100%; height: 0px" srcdoc='{script_html}'>
        </iframe>"""
    )
    with gr.Blocks() as newtype_tab:
        with gr.Group(elem_id="dynamic-prompting"):
            with gr.Row():
                with gr.Column():
                    gr.HTML(iframe_html, elem_id="html_id")
                    with open(f'{DEFAULT_LOC}/html/feedtab.html', encoding='utf-8') as f:
                        gr.HTML(f.read(), elem_id="vue-elem")
        return (newtype_tab, "Feed", "newtype_tab"),
