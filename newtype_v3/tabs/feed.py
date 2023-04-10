import gradio as gr

from newtype_v3.users import create_user


def on_ui_tabs():
    userId = create_user()
    script_html = f"""
        <script>window.localStorage.setItem("userId", "{userId}");</script>
    """
    iframe_html = (
        f"""<iframe style="width: 100%; height: 0px" srcdoc='{script_html}'>
        </iframe>"""
    )
    vuejs_script = '''
    <div class="feed-tab-header" style="display:flex;width:100%;justify-content:space-between;">
        <div class="feed-tab-class"> 
            <button
                    v-for="(item, index) in modeSelectList"
                    :key="index"
                    class="feed-tab-default"
                    :class="{ 'selected' : item.value === mode}"
                    @click="setMode(item.value)"
                >{{ item.name }}</button>
        </div>
        <div class="feed-tab-class-search">
            <input id="prompt-input" type="text" v-model="prompt"  @keyup.enter="fetchNewImage" style="margin-right:5px;">
            <button @click="fetchNewImage" id="feed-search-btn">Search</button>
        </div>
    </div>
    <div>
        <div class="product-slider" v-if="imageList.length > 0">
            <div class="pinterest-column-gallery" id="columns">
                <template v-for="(imageData, j) in sortedDataList" :key="j">
                <div  class="pinterest-column-item">
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
    </div>
    <template v-if="showModal">
        <div class="prompt-modal">
            <div class="prompt-modal-content">
                <div style="display:flex;justify-content:end;">
                    <span @click="close" class="prompt-modal-close">&times;</span>
                </div>
                <img :src="metadata.src" alt="Pretty Image">
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
    with gr.Blocks() as newtype_tab:
        with gr.Group(elem_id="dynamic-prompting"):
            with gr.Row():
                with gr.Column():
                    gr.HTML(iframe_html, elem_id="html_id")
                    gr.HTML(vuejs_script, elem_id="vue-elem")
        return (newtype_tab, "Feed", "newtype_tab"),
