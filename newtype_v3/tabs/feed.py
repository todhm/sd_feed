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
                <div v-if="mode=='private'" class="pinterest-column-item">
                    <label for="image-input-file" style="background-color:#AFB6BD;width:100%;aspect-ratio:1/1;">
                        <div style="background-color:#AFB6BD;width:100%;aspect-ratio:1/1;display:flex; align-items:center;justify-content:center;">
                            <div style="background-color:white;width:80%;aspect-ratio:1/1;display:flex; align-items:center;justify-content:center;">
                                <div v-if="!loading">
                                    <div style="color:#AFB6BD;font-size:18px;display:flex;justify-content:center;">
                                        Please Upload Image
                                    </div>
                                    <div style="color:#AFB6BD;font-size:15px;display:flex;justify-content:center;">-or-</div>
                                    <div style="color:#AFB6BD;font-size:18px;display:flex;justify-content:center;">Click and upload</div>
                                </div>
                                <div v-if="loading">
                                    <div style="color:#AFB6BD;font-size:18px;display:center;justify-content:center;">
                                        Loading Image...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>
                    <input
                        id="image-input-file"
                        type="file"
                        multiple
                        accept="image/*"
                        style="display:none;"
                        @change="uploadImage"
                    >
                </div>
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
         <div style="display:flex;justify-content:center;max-width:420px;" v-if="imageList.length == 0 & mode=='private'">
                <div style="width:100%;">
                    <label for="image-input-file" style="background-color:#AFB6BD;width:100%;aspect-ratio:1/1;">
                        <div style="background-color:#AFB6BD;width:100%;aspect-ratio:1/1;display:flex; align-items:center;justify-content:center;">
                            <div style="background-color:white;width:80%;aspect-ratio:1/1;display:flex; align-items:center;justify-content:center;">
                                <div v-if="!loading">
                                    <div style="color:#AFB6BD;font-size:18px;display:flex;justify-content:center;">
                                        Please Upload Image
                                    </div>
                                    <div style="color:#AFB6BD;font-size:15px;display:flex;justify-content:center;">-or-</div>
                                    <div style="color:#AFB6BD;font-size:18px;display:flex;justify-content:center;">Click and upload</div>
                                </div>
                                <div v-if="loading">
                                    <div style="color:#AFB6BD;font-size:18px;display:center;justify-content:center;">
                                        Loading Image...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>
                    <input
                        id="image-input-file"
                        type="file"
                        multiple
                        accept="image/*"
                        style="display:none;"
                        @change="uploadImage"
                    >
                </div>
         </div>
    </div>
    <template v-if="this.showModal">
        <div class="prompt-modal">
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
                            <textarea v-model="comment" @input="handleTextareaInput" id="modal-writer-type" class="modal-writer-type" @focus="makeSaveButtonVisible" placeholder="Type your comment"></textarea>
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
    </template>
    '''
    with gr.Blocks() as newtype_tab:
        with gr.Group(elem_id="dynamic-prompting"):
            with gr.Row():
                with gr.Column():
                    gr.HTML(iframe_html, elem_id="html_id")
                    gr.HTML(vuejs_script, elem_id="vue-elem")
        return (newtype_tab, "Feed", "newtype_tab"),
