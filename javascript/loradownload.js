
waitForElementToDisplay(
  "#lora-search-table",
  function(){
      const loraModel = {
          data() {
              return {
                  loraList: [],
                  loraString: '',
              }
          },
          methods: {
              setUrlData(url, fname){
                const textArea = gradioApp().querySelector("#lora-download-url")
                textArea.value = url;
                const fnameInput = gradioApp().querySelector("#lora-filename")
                fnameInput.value = fname;
                const downloadBtn = gradioApp().querySelector('#lora_download_btn');
                downloadBtn.click();
              }
          },
          mounted(){
            var self = this;
            const textArea = gradioApp().querySelector("#table-data").querySelector('textarea');
            const searchLoraBtn = gradioApp().querySelector("#lora_search_button");
            const tableArea = gradioApp().querySelector("#table-data");
            searchLoraBtn.addEventListener('click', (e)=>{

            const interval = 500; // 1 second
            const duration = 15000; // 15 seconds
            let count = 0;
            const timer = setInterval(() => {
                // Perform your desired actions here            
                count += interval;
                const textArea = gradioApp().querySelector("#table-data").querySelector('textarea');
                const textAreaValue = textArea.value;
                let newJson;
                try{
                    newJson = JSON.parse(textAreaValue.replace('(','[').replace(',)', ')').replace(')',']').replaceAll("'", '"'));
                }catch(e){
                    console.log(e);
                    newJson = [];
                }            
                if (textAreaValue !== self.loraString||count >= duration) {
                    self.loraString = textAreaValue;
                    self.loraList = newJson;
                    clearInterval(timer);
                }
            }, interval);
            });
          },
      };
      const loraApp =  Vue.createApp(loraModel);
      loraApp.mount(gradioApp().querySelector("#lora-search-table"));
  },1000,9000);