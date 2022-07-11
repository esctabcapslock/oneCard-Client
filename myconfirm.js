const isSafari = navigator.userAgent.includes('Mac')
function myConfirm(title, msg, list) {
    return new Promise(res=>{
        console.log('myConfirm',title,msg,list)
      // list: 선택지
  //     list = [
  //       { 
  //         html: '<input id="btn1" type="text">',
  //         id:'btn1',
  //         checkfn:async ()=>true,
  //         filiter:(v)=>v,
  //         getdata:()=>document.getElementById('btn1').value
  //     },
  //     {
  //       html:`<div class="" id="askFigure">
  //   <input class="btn-check" type="radio" name="sultselect" id="sult0" autocomplete="off" checked>
  //   <label class="btn btn-outline-dark" for="sult0"> ♠ </label>
  //   <input class="btn-check" type="radio" name="sultselect" id="sult1" autocomplete="off" >
  //   <label class="btn btn-outline-dark" for="sult1"> ♣ </label>
  //   <input class="btn-check" type="radio" name="sultselect" id="sult2" autocomplete="off" >
  //   <label class="btn btn-outline-danger" for="sult2"> ♥ </label>
  //   <input class="btn-check" type="radio" name="sultselect" id="sult3" autocomplete="off" >
  //   <label class="btn btn-outline-danger" for="sult3"> ♦ </label>
  // </div>`,
  //     id:'askFigure',
  //     checkfn:false,
  //     getdata:()=>['♠','♣','♥','♦'][['sult0','sult1','sult2','sult3'].map((v,i)=>document.getElementById(v).checked?i:false).filter(v=>v!==false)[0]]
  //     }
  //     ]
  let $myConfirm = document.getElementById('myConfirm');
  if($myConfirm===null) {
    $myConfirm = document.createElement('div')
    $myConfirm.id = 'myConfirm'
    document.body.append($myConfirm)
  }

  $myConfirm.innerHTML += `<div class="row justify-content-center align-items-center h-100">
    <div id="myConfirm_msgbox" class="container card card-block">
      <div calss="row"><h2 class="text-center"><b>${title}</b></h2></div>
      <div calss="row py-3" class="text-center">${msg}</div>
      <div calss="row py-3">
      ${list.map(v=>
        `<div class='row text-center'><div>${v.html}`+(v.checkfn?` <output id="output_${v.id}" class="${isSafari?'':'align-top'}"></output>`:``)+`</div></div>`).join('\n')}
      </div>
      <div class="text-center py-2 ">
        <button id="myConfirmSubmit" type="button" class="btn btn-dark">확인</button>
      </div>
    </div>
  </div>`


      list.map(v=>{
        const ele = document.getElementById(v.id)
        if(!ele) throw('ele 없음',ele)
        const chf = async e=> {
          if(v.filiter) ele.value = v.filiter(ele.value)
          if(v.checkfn){
            const output = document.getElementById(`output_${v.id}`)
            const flag  = await v.checkfn(ele.value)
            output.setAttribute('check',`${flag}`)
            if(flag) output.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="green"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`
            else output.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"  fill="red"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'

            document.getElementById('myConfirmSubmit').disabled  = !flag

          }
        }
        ele.addEventListener('change',chf)
        ele.addEventListener('keyup',chf)
        ele.addEventListener('mousemove',chf)
        chf()
      })
      
      // const clar = [...$myConfirm.getElementsByClassName('myConfirmOut')].forEach(ele => {
      document.getElementById('myConfirmSubmit').addEventListener('click', e => {
          const out = {}
          console.log('[myConfirmSubmit] click',e)
          if(!list.every(v=>{
            if(v.checkfn) {
              if (document.getElementById(`output_${v.id}`).attributes['check'].value != 'true') {
                console.error('참 X',v,e);
                return false
              } // 참이 아니어서 실패
            }
            out[v.id] = v.getdata()
            return true
          })) {
            console.error('이상함')
            return false
          }
          res(out)
          $myConfirm.remove()
        })
      // });
    })
  }
      