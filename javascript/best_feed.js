
function waitForElementToDisplay2(selector, callback, checkFrequencyInMs, timeoutInMs) {
    (function loopSearch() {
      if (document.querySelector(selector) != null) {
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
  waitForElementToDisplay2(
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
      const userModel = {
            data() {
                return {
                    bestFeeds: [],
                    comments: [],
                    userId: '',
                    showCommentWrite: false,
                    comment: '',
                    src: '',
                    imageId: "",
                    metadata: {},
                    currentItem: {},
                    filterNsfw: false,

                }
            },
            methods: {
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
                fetchBests(){
                  const token = localStorage.getItem("token");
                  const userId = localStorage.getItem("userId");
                  const headers={"Authorization":"Token " + token};
                  const params = {
                    filter_nsfw: this.filterNsfw,
                  };
                  axios.get(
                        `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/best/${userId}`,
                        {
                          headers,
                          params
                        }
                    )
                    .then(response => {
                        const dataObject = response.data;
                        this.bestFeeds = dataObject.slice(0, 4);
                    }).catch(error => {
                        this.loading = false;
                        console.log(error)
                    });
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
                  this.$forceUpdate();
                  this.currentItem = item;
                  this.metadata = item.metadata;
                  this.src = item.url;
                  this.imageId = item.id;
                  item.total_clicks += 1;
                  this.addImageClick();
                  this.fetchComments();
                },
                openModalSecond(event){
                  console.log(event);


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
                    this.showModal = true;
                  }).catch(error => {
                      this.loading = false;
                      console.log(error)
                  })
                },
                sendToTextToImage(){
                  const userId = localStorage.getItem("userId");
                  const token = localStorage.getItem("token");
                  const headers={"Authorization":"Token " + token};

                  const imageId = this.imageId;
                  this.currentItem.total_sendto = this.currentItem.total_sendto + 1;
                  axios.post(
                      'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/send_to',
                      {
                        userId,
                        imageId,
                        sendType: "SEND_TO_TEXT",
                      },
                      {
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
                      },
                      {
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
                    window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_width')[0].props.value = parseInt(this.metadata['Size-1']);
                    const textWidthList = gradioApp().querySelector( '#txt2img_width' ).getElementsByTagName('input');
                    if(textWidthList&&textWidthList.length> 1){
                      textWidthList[0].value = this.metadata['Size-1'];
                      textWidthList[1].value = this.metadata['Size-1'];
                    }
                  }catch(e){
                  }
                  try{
                    window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_height')[0].props.value = parseInt(this.metadata['Size-2']);
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
                      try{
                        window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hires_steps')[0].props.value = parseInt(this.metadata['Hires steps']);
                      }catch(e){
                        window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hires_steps')[0].props.value = 0;
                      }
                      
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
                      window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hr_scale')[0].props.value = this.metadata['Hires upscale'];
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
                      let hiresValue = parseInt(this.metadata['Hires resize-1']);
                      if(hiresValue == 0){
                        hiresValue = parseInt(this.metadata['Size-1']);
                      }
                      window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hr_resize_x')[0].props.value = hiresValue;
                      const cfgScaleList = gradioApp().querySelector( '#txt2img_hr_resize_x' ).getElementsByTagName('input');
                      if(cfgScaleList&&cfgScaleList.length> 1){
                        cfgScaleList[0].value = this.metadata['Hires resize-1'];
                        cfgScaleList[1].value = this.metadata['Hires resize-1'];
                      }
                    }catch(e){
                      console.log(e);
                      console.log('errorhr2');
                    }
                    try{
                      let hiresValueSecond = parseInt(this.metadata['Hires resize-2']);
                      if(hiresValueSecond == 0){
                        hiresValueSecond = parseInt(this.metadata['Size-2']);
                      }
                      window.gradio_config.components.filter(el=>el.props.elem_id=='txt2img_hr_resize_y')[0].props.value = hiresValueSecond;
                      const cfgScaleList = gradioApp().querySelector( '#txt2img_hr_resize_y' ).getElementsByTagName('input');
                      if(cfgScaleList&&cfgScaleList.length> 1){
                        cfgScaleList[0].value = this.metadata['Hires resize-2'];
                        cfgScaleList[1].value = this.metadata['Hires resize-2'];
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
                      },
                      {
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
                  console.log('delete');
                  const userId = localStorage.getItem("userId");
                  item.liked = false;
                  item.likecount = item.likecount -1 ;
                  const token = localStorage.getItem("token");
                  const headers={"Authorization":"Token " + token};
                  axios.delete(
                    `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/like`,
                    {
                      data: {
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
                      },
                      {
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
                  var self = this;
                  const token = localStorage.getItem("token");
                  const headers={"Authorization":"Token " + token};
                  axios.get(
                    `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/comments/${this.currentItem.id}`,
                    {
                      headers
                    }
                  ).then((res)=>{
                    self.comments = res.data;
                  }).catch((e)=>{
                    console.log(e);
                  })
                },
            },
            computed:{
              isModalOpen(){
                return this.showModal;
              },
            },
            created() {
                const userId = localStorage.getItem("userId");
                const token = localStorage.getItem("token");
                const headers={"Authorization":"Token " + token};
                axios.get(
                    `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/best/${userId}`,
                    {
                      headers
                    }
                    )
                .then(response => {
                    const dataObject = response.data;
                    this.userId = userId;
                    this.bestFeeds = dataObject.slice(0, 4);
                }).catch(error => {
                    this.loading = false;
                    console.log(error)
                })
            },
        };
        const fetchApp =  Vue.createApp(userModel);
        if (document.querySelector("#best-product-tab") != null) {
          fetchApp.mount('#best-product-tab');
        }else{
          fetchApp.mount(document.getElementsByTagName("gradio-app")[0].shadowRoot.getElementById("best-product-tab"));
        }
        console.log('mount success');
    },1000,9000);

