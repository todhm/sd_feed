waitForElementToDisplay(
    "#feed-profile-tab",
    function(){
        const userModel = {
            data() {
                return {
                    userId: '',
                    nickname: '',
                    likeCount: 0,
                    editMode: false,
                    loading: false,
                }
            },
            methods: {
                close() {},
                mounted(){},
                beforeDestroy(){},
                setEditMode(){
                    this.editMode = !this.editMode;
                },
                saveNickname(){
                    const userId = localStorage.getItem("userId");
                    axios.post(
                        `https://newtypev3-server-vjiloyvjvq-an.a.run.app/user/profile`,
                        {
                            userId,
                            nickname: this.nickname,
                        }, 
                      )
                      .then(response => {
                        this.editMode = false;        
                      })
                      .catch(error => {
                        this.loading = false;
                        alert(error.response.data.detail);
                      })
                },
               
            },
            created() {
                const userId = localStorage.getItem("userId");
                axios.get(
                    `https://newtypev3-server-vjiloyvjvq-an.a.run.app/user/profile/${userId}`,
                    )
                .then(response => {
                    const dataObject = response.data;;
                    this.likeCount = dataObject.likecount; 
                    this.nickname = dataObject.nickname; 
                    this.userId = userId;
                }).catch(error => {
                    this.loading = false;
                    console.log(error)
                })
            },
        };
        const fetchApp =  Vue.createApp(userModel);
        if (document.querySelector("#feed-profile-tab") != null) {
          fetchApp.mount('#feed-profile-tab');
        }else{
          fetchApp.mount(document.getElementsByTagName("gradio-app")[0].shadowRoot.getElementById("feed-profile-tab"));
        }

        console.log("mount success");
    },1000,9000);