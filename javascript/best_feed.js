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
    "#best-product-tab",
    function(){
        const userModel = {
            data() {
                return {
                    bestFeeds: [],
                    userId: '',
                    showModal: false,
                    src: '',
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
                openModal(item){
                    this.metadata = item.metadata;
                    this.src = item.url;
                    this.showModal = true;
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
            },
            created() {
                const userId = localStorage.getItem("userId");
                axios.get(
                    `https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/best/${userId}`,
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
    },1000,9000);