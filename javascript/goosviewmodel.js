var installLoaded = {};
function addScript(url) {
    if (!installLoaded[url]) {
        var s = document.createElement('script');
        s.src = url;
        document.head.appendChild(s);
        installLoaded[url] = true;
    }
}
function waitForElementToDisplay(selector, callback, checkFrequencyInMs, timeoutInMs) {
  (function loopSearch() {
    if (document.querySelector(selector) != null&& window.localStorage.getItem("userId")) {
      callback();
      return;
    }
    else if(document.getElementsByTagName("gradio-app").length > 0 && 
    document.getElementsByTagName("gradio-app")[0].shadowRoot){
      callback();
      return;
    }
    else {
      setTimeout(function () {
        loopSearch();
      }, checkFrequencyInMs);
    }
  })();
}
const reorderData=(arr, columns)=>{
  const cols = columns;
  const out = [];
  let col = 0;
  while(col < cols) {
      for(let i = 0; i < arr.length; i += cols) {
          let _val = arr[i + col];
          if (_val !== undefined)
              out.push(_val);
      }
      col++;
  }
  return out;
}

// addScript('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js');
// addScript('https://unpkg.com/vue@3.2.6/dist/vue.global.prod.js');


waitForElementToDisplay(
    "#html_id",
    function(){
      async function copyToClipboard(textToCopy) {
        // Navigator clipboard api needs a secure context (https)
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
        } else {
            // Use the 'out of viewport hidden text area' trick
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
                
            // Move textarea out of the viewport so it's not visible
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
                
            document.body.prepend(textArea);
            textArea.select();
    
            try {
                document.execCommand('copy');
            } catch (error) {
                console.error(error);
            } finally {
                textArea.remove();
            }
        }
      };
        const imageModel = {
            data() {
                return {
                    page: 1,
                    loading: false,
                    uploadLoading: false,
                    imageList: [],
                    sortedDataList: [],
                    carouselBtnTop: 150,
                    showCommentWrite: false,
                    modeSelectList: [
                      { name: "Newest", value: "latest" },
                      { name: "Popular", value: "likes" },
                      { name: "Favorite", value: "favorite" },
                      { name: "My Feed", value: "private" },
                    ],
                    mode: "latest",
                    prompt: "",
                    showModal: false,
                    metadata: {},
                    filterNsfw: false,
                    animeTag: false,
                    realTag: false,
                    nickname: '',
                    profile: '',
                    editMode: false,
                    userId: '',
                    searchNickname: "",
                    searchProfile: "",
                }
            },
            computed: {
              parsedProfile(){
                if(!this.profile){
                  return this.profile;
                }
                return this.profile.replaceAll("\n", "<br/>");
              },
              parsedSearchProfile(){
                if(!this.searchProfile){
                  return '';
                }
                return this.searchProfile.replaceAll("\n", "<br/>");
              }
            },
            watch: {
              showModal() {   
                if (this.showModal === false) {
                  window.removeEventListener("keyup", this.onEscapeKey);
                } else {
                  window.addEventListener("keyup", this.onEscapeKey);
                }
              }
            },
            methods: {
            setEditMode(){
                this.editMode = !this.editMode;
            },
            setNicknameSearch(){
              this.mode = 'nicknameSearch';
              const feedUserButton = gradioApp().querySelector('#feed-user-tab');
              const nickname = feedUserButton.getAttribute("data-value");
              this.searchNickname = nickname;
              this.fetchSearchProfile();
              this.fetchNewImage();
            },
            moveFeedProfileTab(nickname){
              if(nickname){
                this.close();
                const buttonList = gradioApp().querySelector('#tabs').querySelectorAll('button');
                for (step = 0; step < buttonList.length; step++) {
                  // Runs 5 times, with values of step 0 through 4.
                  if(buttonList[step].textContent.trim() == 'Feed'){
                    buttonList[step].click();
                    break;
                  }
                }
                try{
                  const feedUserButton = gradioApp().querySelector('#feed-user-tab');
                  feedUserButton.setAttribute("data-value", nickname);
                  feedUserButton.innerHTML = nickname;
                  feedUserButton.click();
                  
                }catch(e){
                  console.log(e);
                }
                
              }
              
            },
            saveNickname(){
                const userId = localStorage.getItem("userId");
                const token = localStorage.getItem("token");
                const headers={"Authorization":"Token " + token};
                axios.post(
                    `https://newtypev3-server-vjiloyvjvq-an.a.run.app/user/profile`,
                    {
                        userId,
                        nickname: this.nickname,
                        profile: this.profile,
                    }, 
                    {
                        headers
                    }
                  )
                  .then(response => {
                    this.editMode = false;        
                  })
                  .catch(error => {
                    this.loading = false;
                    alert(error.response.data.detail);
                  })
            },
            selectAnimeTag(){
                if(this.animeTag == false){
                    this.animeTag = true;
                    this.realTag = false;
                }else{
                    this.animeTag = false;
                    this.realTag = false;
                }
                this.fetchNewImage();
            },
            selectRealTag(){
                if(this.realTag == false){
                    this.realTag = true;
                    this.animeTag = false;
                }else{
                    this.realTag = false;
                    this.animeTag = false;
                }
                this.fetchNewImage();
            },
              async uploadImage(event){
                this.uploadLoading = true;
                const files = event.target.files;
                const userId = localStorage.getItem("userId");
                for (let i=0; i<files.length; i++) {
                  if(!files[i].type.match(/^image\//)){
                    alert('이미지 파일만 업로드할 수 있습니다.');
                  } else if(files[i].size > 50000000) {
                    alert('You cannot upload file larger than 50MB');
                  } else {
                    var body = new FormData();
                    body.append('upload_file',files[i]);
                    body.append('userId', userId);
                    body.append('extractMetadata', true);
                    const token = localStorage.getItem("token");
                    const headers={"Authorization":"Token " + token};
                    try{
                      await axios({
                        url: 'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/image',
                        method: 'post',
                        withCredentials:true,
                        data: body,
                        headers
                      });
                    }catch(e){
                      console.log(e);
                    }
                  }
                }
                this.setMode('private');
                this.uploadLoading = false;
              },
            close() {
                this.$emit('close');
                this.showModal=false;
                this.imageId = "";
                this.src = "";
                this.comment = '';
                this.comments = [];
            },
            closeOutsideModal(event) {
              if(!event.target.closest('.prompt-modal-image-tag')){
                this.$emit('close');
                this.showModal=false;
                this.imageId = "";
                this.src = "";
                this.comment = '';
                this.comments = [];
              }
            },
            onEscapeKey(event) {
              if (event.keyCode === 27 || event.key === 'Escape') {
                  // Perform action when "Esc" key is pressed
                  this.close();
              }
              // Perform action when "Esc" key is pressed
            },
            formatNumber(num) {
                if (num >= 1000000) {
                  return (num / 1000000).toFixed(1) + 'm';
                } else if (num >= 1000) {
                  return (num / 1000).toFixed(1) + 'k';
                } else {
                  return num.toString();
                }
            },
            openModal(item){
              this.showModal = true;
              this.currentItem = item;
              this.metadata = item.metadata;
              this.src = item.url;
              this.imageId = item.id;
              item.total_clicks += 1;
              this.addImageClick();
              this.fetchComments();
            },
            addImageClick(){
              const userId = localStorage.getItem("userId");
              const imageId = this.imageId;
              const token = localStorage.getItem("token");
              const headers={"Authorization":"Token " + token};
              axios.post(
                  'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/click',
                  {
                    userId,
                    imageId,
                  },
                  {
                    headers
                  }
                  )
              .then(response => {
                
              }).catch(error => {
                  this.loading = false;
                  console.log(error)
              })
            },
            sendToTextToImage(){
              const userId = localStorage.getItem("userId");
              const imageId = this.imageId;
              const token = localStorage.getItem("token");
              const headers={"Authorization":"Token " + token};
              this.currentItem.total_sendto = this.currentItem.total_sendto + 1;
              axios.post(
                  'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/send_to',
                  {
                    userId,
                    imageId,
                    sendType: "SEND_TO_TEXT",
                  },{
                    headers
                  }
                  )
              .then(response => {
                this.sendToTextProcess();
              }).catch(error => {
                  this.loading = false;
                  console.log(error)
              })
            },
            copyClipboard(){
              const userId = localStorage.getItem("userId");
              const imageId = this.imageId;
              const token = localStorage.getItem("token");
              const headers={"Authorization":"Token " + token};
              axios.post(
                  'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/send_to',
                  {
                    userId,
                    imageId,
                    sendType: "COPY_TO_CLIPBOARD",
                  },{
                    headers
                  }
                  )
              .then(response => {
                let filteredObject = '';
                for (const [k, v] of Object.entries(this.metadata)) {
                  if (/^[A-Z]/.test(k)) {
                    filteredObject += `${k}:${v},`;
                  }
                }
                this.currentItem.total_sendto = this.currentItem.total_sendto + 1;
                copyToClipboard(filteredObject);
              }).catch(error => {
                  this.loading = false;
                  console.log(error)
              });

            },
            sendToTextProcess(){
              const textPrompt = gradioApp().querySelector('#txt2img_prompt').getElementsByTagName( 'textarea' );
              if(textPrompt&&textPrompt.length> 0){
                window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_prompt')[0].props.value = this.metadata.prompt;
                textPrompt[0].value = this.metadata.prompt;
              }
              const negativePrompt = gradioApp().querySelector('#txt2img_neg_prompt').getElementsByTagName( 'textarea' );
              if(negativePrompt&&negativePrompt.length> 0){
                window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_neg_prompt')[0].props.value = this.metadata.negative_prompt;
                negativePrompt[0].value = this.metadata.negative_prompt;
              }
              try{
                const samplerList = gradioApp().querySelector( '#txt2img_sampling' ).getElementsByTagName('span');
                if(samplerList&&samplerList.length> 1){
                  window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_sampling')[0].props.value = this.metadata.sampler;
                  samplerList[1].textContent = this.metadata.sampler;
                }
              }catch(e){
              }

              try{
                const textImageStepsList = gradioApp().querySelector( '#txt2img_steps' ).getElementsByTagName('input');
                if(textImageStepsList&&textImageStepsList.length> 1){
                  window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_steps')[0].props.value = parseInt(this.metadata.n_iter);
                  textImageStepsList[0].value = this.metadata.n_iter;
                  textImageStepsList[1].value = this.metadata.n_iter;
                }
              }catch(e){
              }
              try{
                window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_width')[0].props.value = parseFloat(this.metadata['Size-1']);
                const textWidthList = gradioApp().querySelector( '#txt2img_width' ).getElementsByTagName('input');
                if(textWidthList&&textWidthList.length> 1){
                  textWidthList[0].value = this.metadata['Size-1'];
                  textWidthList[1].value = this.metadata['Size-1'];
                }
              }catch(e){
              }
              try{
                window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_height')[0].props.value = parseFloat(this.metadata['Size-2']);
                const textWidthList = gradioApp().querySelector( '#txt2img_height' ).getElementsByTagName('input');
                if(textWidthList&&textWidthList.length> 1){
                  textWidthList[0].value = this.metadata['Size-2'];
                  textWidthList[1].value = this.metadata['Size-2'];
                }
              }catch(e){
              }
              try{
                window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_cfg_scale')[0].props.value = parseFloat(this.metadata['cfg_scale']);
                const cfgScaleList = gradioApp().querySelector( '#txt2img_cfg_scale' ).getElementsByTagName('input');
                if(cfgScaleList&&cfgScaleList.length> 1){
                  cfgScaleList[0].value = this.metadata['cfg_scale'];
                  cfgScaleList[1].value = this.metadata['cfg_scale'];
                }
              }catch(e){
              }
              try{
                const steps = this.metadata['Hires upscaler'];
                if(steps){
                  window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_enable_hr')[0].props.value = true;
                  gradioApp().querySelector( '#txt2img_enable_hr' ).getElementsByTagName('input')[0].checked = true;
                  try{
                    const originalHires = gradioApp().querySelector( '#txt2img_hires_fix' );
                    originalHires.classList.remove('hidden');
                  }catch(e){
                    
                  }
                  const scalerMethod = this.metadata['Hires upscaler'];
                  const containUpscaler = window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hr_upscaler')[0].props.choices.includes(scalerMethod);
                  if(containUpscaler){
                    window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hr_upscaler')[0].props.value = this.metadata['Hires upscaler'];
                    const hr_span = gradioApp().querySelector( '#txt2img_hr_upscaler' ).getElementsByTagName('span');
                    hr_span[0].textContent = this.metadata['Hires upscaler'];

                    const cfgScaleList = gradioApp().querySelector( '#txt2img_enable_hr' ).getElementsByTagName('input');
                  if(cfgScaleList&&cfgScaleList.length> 1){
                    cfgScaleList[0].value = this.metadata['cfg_scale'];
                    cfgScaleList[1].value = this.metadata['cfg_scale'];
                  }
                }  
                try{
                  window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hires_steps')[0].props.value = parseInt(this.metadata['Hires steps']);
                  const cfgScaleList = gradioApp().querySelector( '#txt2img_hires_steps' ).getElementsByTagName('input');
                  if(cfgScaleList&&cfgScaleList.length> 1){
                    cfgScaleList[0].value = this.metadata['Hires steps'];
                    cfgScaleList[1].value = this.metadata['Hires steps'];
                  }
                }catch(e){
                  console.log(e);
                  console.log('errorhr0');
                }
                try{
                  window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hr_scale')[0].props.value = parseFloat(this.metadata['Hires upscale']);
                  const cfgScaleList = gradioApp().querySelector( '#txt2img_hr_scale' ).getElementsByTagName('input');
                  if(cfgScaleList&&cfgScaleList.length> 1){
                    cfgScaleList[0].value = this.metadata['Hires upscale'];
                    cfgScaleList[1].value = this.metadata['Hires upscale'];
                  }
                }catch(e){
                  console.log(e);
                  console.log('errorhr');
                }
                try{
                  const hiresValue1 = parseInt(this.metadata['Hires resize-1']);
                  console.log(hiresValue1);
                  if(hiresValue1 && hiresValue1 > 0){
                      window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hr_resize_x')[0].props.value = parseInt(this.metadata['Hires resize-1']);
                    const cfgScaleList = gradioApp().querySelector( '#txt2img_hr_resize_x' ).getElementsByTagName('input');
                    if(cfgScaleList&&cfgScaleList.length> 1){
                      cfgScaleList[0].value = this.metadata['Hires resize-1'];
                      cfgScaleList[1].value = this.metadata['Hires resize-1'];
                    }
                  }
                }catch(e){
                  console.log(e);
                  console.log('errorhr2');
                }
                try{
                  const hiresValue2 = parseInt(this.metadata['Hires resize-2']);
                  console.log(hiresValue2);
                  if(hiresValue2 > 0){
                    window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hr_resize_y')[0].props.value = parseInt(this.metadata['Hires resize-2']);
                    const cfgScaleList = gradioApp().querySelector( '#txt2img_hr_resize_y' ).getElementsByTagName('input');
                    if(cfgScaleList&&cfgScaleList.length> 1){
                      cfgScaleList[0].value = this.metadata['Hires resize-2'];
                      cfgScaleList[1].value = this.metadata['Hires resize-2'];
                    }
                  }
                }catch(e){
                  console.log(e);
                  console.log('errorhr3');
                }
                }
              
                

              }catch(e){
                console.log(e);
                console.log('errorhr4');
              }
              this.close();
              switch_to_txt2img();
            },
            sendToImageToImage(){
              const userId = localStorage.getItem("userId");
              const imageId = this.imageId;
              const token = localStorage.getItem("token");
              const headers={"Authorization":"Token " + token};
              axios.post(
                  'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/send_to',
                  {
                    userId,
                    imageId,
                    sendType: "SEND_TO_IMAGE",
                  },{
                    headers
                  }
              )
              .then(response => {
                var xhr = new XMLHttpRequest();
                var self = this;
                xhr.onload = function() {
                    var reader = new FileReader();
                    reader.onloadend = function() {
                      self.sendToImageToImageProcess(reader.result);
                    }
                    reader.readAsDataURL(xhr.response);
                };
                xhr.open('GET', this.src);
                xhr.responseType = 'blob';
                xhr.send();
                this.currentItem.total_sendto = this.currentItem.total_sendto + 1;
                
              }).catch(error => {
                  this.loading = false;
                  console.log(error)
              })
            },
            sendToImageToImageProcess(date64Image){
              try{
                window.gradio_config.components.filter(el=>el.props.elem_id=='img2img_image')[0].props.value = date64Image;
              }catch(e){

              }
              try{
                const textPrompt = gradioApp().querySelector('#img2img_prompt').getElementsByTagName( 'textarea' );
                if(textPrompt&&textPrompt.length> 0){
                  window.gradio_config.components.filter(el=>el.props.elem_id=='img2img_prompt')[0].props.value = this.metadata.prompt;
                  textPrompt[0].value = this.metadata.prompt;
                }
              }catch(e){
                console.log('Error prompt img2img');
                console.log(e);

              }
              try{
                const negativePrompt = gradioApp().querySelector('#img2img_neg_prompt').getElementsByTagName( 'textarea' );
                if(negativePrompt&&negativePrompt.length> 0){
                  window.gradio_config.components.filter(el=>el.props.elem_id=='img2img_neg_prompt')[0].props.value = this.metadata.negative_prompt;
                  negativePrompt[0].value = this.metadata.negative_prompt;
                }
              }catch(e){
                console.log('Error neg img2img');
                console.log(e);

              }
              
              
              try{
                const samplerList = gradioApp().querySelector( '#img2img_sampling' ).getElementsByTagName('span');
                if(samplerList&&samplerList.length> 1){
                  window.gradio_config.components.filter(el=>el.props.elem_id=='img2img_sampling')[0].props.value = this.metadata.sampler;
                  samplerList[1].textContent = this.metadata.sampler;
                }
              }catch(e){
              }

              try{
                const textImageStepsList = gradioApp().querySelector( '#img2img_steps' ).getElementsByTagName('input');
                if(textImageStepsList&&textImageStepsList.length> 1){
                  window.gradio_config.components.filter(el=>el.props.elem_id=='img2img_steps')[0].props.value = parseInt(this.metadata.n_iter);
                  textImageStepsList[0].value = this.metadata.n_iter;
                  textImageStepsList[1].value = this.metadata.n_iter;
                }
              }catch(e){
                console.log('Error steps img2img');
                console.log(e);

              }
              try{
                window.gradio_config.components.filter(el=>el.props.elem_id=='img2img_width')[0].props.value = parseInt(this.metadata['Size-1']);
                const textWidthList = gradioApp().querySelector( '#img2img_width' ).getElementsByTagName('input');
                if(textWidthList&&textWidthList.length> 1){
                  textWidthList[0].value = this.metadata['Size-1'];
                  textWidthList[1].value = this.metadata['Size-1'];
                }
              }catch(e){
                console.log('Error width img2img');
                console.log(e);
              }
              try{
                window.gradio_config.components.filter(el=>el.props.elem_id=='img2img_height')[0].props.value = parseInt(this.metadata['Size-2']);
                const textWidthList = gradioApp().querySelector( '#img2img_height' ).getElementsByTagName('input');
                if(textWidthList&&textWidthList.length> 1){
                  textWidthList[0].value = this.metadata['Size-2'];
                  textWidthList[1].value = this.metadata['Size-2'];
                }
              }catch(e){
                console.log('Error width height2img');
                console.log(e);
              }
              this.close();
              switch_to_img2img();
            },
            addToWishList(item){
                const userId = localStorage.getItem("userId");
                const token = localStorage.getItem("token");
                const headers={"Authorization":"Token " + token};
                item.liked = true;
                item.likecount = item.likecount + 1;
                axios.post(
                  `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/like`,
                  {
                    userId, 
                    imageId: item.id,
                  }, 
                  {
                    headers
                  }
                )
            },
            handleTextareaInput(event) {
              let textarea = event.target;
              textarea.style.height = 'auto';
              textarea.style.height = (textarea.scrollHeight) + 'px';
              comment = event.target.text;
            },
            deleteWishList(item){
              const userId = localStorage.getItem("userId");
              item.liked = false;
              item.likecount = item.likecount -1 ;
              const token = localStorage.getItem("token");
              const headers={"Authorization":"Token " + token};
              axios.delete(
                `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/like`,
                {data: {
                  userId, 
                  imageId: item.id,
                },
                headers
              }, 
              )
            },
            makeSaveButtonVisible(){
              this.showCommentWrite = true;
            },
            hideSaveButtonVisible(){
              this.comment = '';
              this.showCommentWrite = false;
              const textArea = gradioApp().querySelector("#modal-writer-type");
              textArea.style.height = 'auto';
              textArea.style.height = (textarea.scrollHeight) + 'px';
            },
            writeComment(){
              if(this.comment.length > 0){
                const userId = localStorage.getItem("userId");
                const token = localStorage.getItem("token");
                const headers={"Authorization":"Token " + token};
                axios.post(
                  `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/comment`,
                  {
                    userId, 
                    imageId: this.currentItem.id,
                    text: this.comment,
                  },{
                    headers
                  } 
                ).then((res)=>{
                  this.fetchComments();
                  this.showCommentWrite = false;
                  this.comment = '';
                  this.currentItem.total_comments = this.currentItem.total_comments + 1;
                }).catch((e)=>{
                  console.log(e);
                });

              }else{
                return false;
              }
            },
            fetchComments(){
              const token = localStorage.getItem("token");
              const headers={"Authorization":"Token " + token};
              axios.get(
                `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/comments/${this.currentItem.id}`,
                {
                  headers
                }
              ).then((res)=>{
                this.comments = res.data;
                this.$forceUpdate();
              }).catch((e)=>{
                console.log(e);
              })
            },
              setOrder(event){
                this.page = 1;
                this.order = event.target.value;
                this.fetchImages();
              },
              setPublic(event){
                this.page = 1;
                this.mode = event.target.value;
                this.fetchImages();
              },
              setMode(mode){
                this.page = 1;
                this.mode = mode;
                this.fetchImages();
              },
              fetchSearchProfile(){
                const params = {
                  nickname: this.searchNickname,
                };
                axios.get(
                  `https://newtypev3-server-vjiloyvjvq-an.a.run.app/user/profile_nickname`,
                  {
                    params
                  }
                ).then((res)=>{
                  this.searchProfile = res.data.profile;
                  this.$forceUpdate();
                }).catch((e)=>{
                  console.log(e);
                })
              },
              fetchNewImage(){
                this.page = 1;
                this.fetchImages();
              },
              fetchImages(){
                this.loading = true;
                if(this.page == -1){
                  this.loading = false;
                  return false;
                }
                const userId = localStorage.getItem("userId");
                const defaultParams = {
                  page: this.page,
                  batch_size: 100, 
                  prompt: this.prompt,
                  filter_nsfw: this.filterNsfw,
                };
                if(this.mode == 'latest'){
                  defaultParams['order'] = 'created_at';
                }
                if(this.mode == 'nicknameSearch'){
                  defaultParams['nickname'] = this.searchNickname;
                  defaultParams['order'] = 'created_at';
                }
                if(this.animeTag){
                  defaultParams['image_tag'] = 'ANIME';
                }
                if(this.realTag){
                  defaultParams['image_tag'] = 'REAL';
                }
                if(this.mode == 'likes'){
                  defaultParams['order'] = 'likes';
                }
                if(this.mode == 'favorite'){
                  defaultParams['only_liked_pictures'] = true;
                  defaultParams['order'] = 'likes_created';
                }
                if(this.mode == 'private'){
                  defaultParams['only_my_pictures'] = true;
                  defaultParams['order'] = 'created_at';
                }
                const token = localStorage.getItem("token");
                const headers={"Authorization":"Token " + token};

                axios.get(
                  `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/images/${userId}`,
                  {params: defaultParams, headers}, 
                )
                .then(response => {
                  if(this.page == 1){
                    this.imageList = response.data;
                  }else{
                    this.imageList = [...this.imageList, ...response.data];
                  }
                  this.sortedDataList = reorderData(this.imageList, 4);
                  if(response.data.length < 100){
                    this.page = -1;
                  }
                  this.loading = false;
                })
                .catch(error => {
                  this.loading = false;
                  console.log(error)
                })
              
              }
            },
            mounted(){
              var self = this;
              waitForElementToDisplay('#feed-header', function(){
              window.addEventListener('scroll', e => {
                const listElem = gradioApp().querySelector("#columns");
                const tabElem = gradioApp().querySelector("#tab_newtype_tab");
                const tabNotVisible = tabElem && tabElem.style && tabElem.style.display && tabElem.style.display == 'none';
                if(listElem&&listElem.clientHeight * 0.8 <= window.scrollY  && self.loading == false && self.page > 0 && !tabNotVisible) {
                  self.page = self.page + 1;
                  self.fetchImages();
                }
              }, false);          
              },1000,9000);
              
            },
            beforeDestroy(){
              
            },
            created() {
              this.fetchImages();
              const userId = localStorage.getItem("userId");
              const token = localStorage.getItem("token");
              const headers={"Authorization":"Token " + token};
              axios.get(
                  `https://newtypev3-server-vjiloyvjvq-an.a.run.app/user/profile/${userId}`,
                  {
                      headers
                  }
                  )
              .then(response => {
                  const dataObject = response.data;;
                  this.likeCount = dataObject.likecount; 
                  this.nickname = dataObject.nickname; 
                  this.profile = dataObject.profile;
                  this.userId = userId;
              }).catch(error => {
                  this.loading = false;
                  console.log(error)
              })
            },
        };
        const fetchApp =  Vue.createApp(imageModel);
        if (document.querySelector("#vue-elem") != null) {
          fetchApp.mount('#vue-elem');
        }else{
          fetchApp.mount(document.getElementsByTagName("gradio-app")[0].shadowRoot.getElementById("vue-elem"));
        }
        // const fileInput = gradioApp().querySelector('#feed-image-upload');
        // fileInput.addEventListener("change", function() {
        //   fileInput.dispatchEvent(new CustomEvent("on_file_upload"));
        //   setTimeout(() =>{
        //     const el = gradioApp().querySelector(
        //       '#feed-search-btn'
        //     );
        //     el.click();
        //   }, 2000);
        // });
        console.log("mount success");
    },1000,9000);