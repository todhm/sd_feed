var loaded = {};
function addScript(url) {
    if (!loaded[url]) {
        var s = document.createElement('script');
        s.src = url;
        document.head.appendChild(s);
        loaded[url] = true;
    }
}
function waitForElementToDisplay(selector, callback, checkFrequencyInMs, timeoutInMs) {
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
addScript('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js');
addScript('https://unpkg.com/vue@3.2.6/dist/vue.global.prod.js');


waitForElementToDisplay(
    "#vue-elem",
    function(){
        const imageModel = {
            data() {
                return {
                    page: 1,
                    loading: false,
                    imageList: [],
                    sortedDataList: [],
                    carouselBtnTop: 150,
                    modeSelectList: [
                      { name: "Newest", value: "latest" },
                      { name: "Popular", value: "likes" },
                      { name: "Favorite", value: "favorite" },
                      { name: "My Pics", value: "private" },
                    ],
                    mode: "latest",
                    prompt: "",
                    showModal: false,
                    metadata: {},
                    
                }
            },
            methods: {
              close() {
                this.$emit('close');
                this.showModal=false;
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
              addToWishList(item){
                const userId = localStorage.getItem("userId");
                item.liked = true;
                item.likecount = item.likecount + 1;
                axios.post(
                  `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/like`,
                  {
                    userId, 
                    imageId: item.id,
                  }, 
                )
              },
              openModal(item){
                this.metadata = item.metadata;
                this.metadata.src = item.url;
                this.showModal = true;
              },
              deleteWishList(item){
                const userId = localStorage.getItem("userId");
                item.liked = false;
                item.likecount = item.likecount -1 ;
                axios.delete(
                  `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/like`,
                  {data: {
                    userId, 
                    imageId: item.id,
                  }}, 
                )

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
                };
                if(this.mode == 'latest'){
                  defaultParams['order'] = 'created_at';
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

                axios.get(
                  `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/images/${userId}`,
                  {params: defaultParams}, 
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
              waitForElementToDisplay('#columns', function(){
              window.addEventListener('scroll', e => {
                let listElem;
                if (document.querySelector('#columns') != undefined && document.querySelector('#columns') != null) {
                  listElem = document.querySelector('#columns');
                }else{
                  listElem = document.getElementsByTagName("gradio-app")[0].shadowRoot.getElementById("columns");
                }
                if(listElem.clientHeight * 0.9 <= window.scrollY  && self.loading == false && self.page > 0) {
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