//// @ts-check
// 나주에...
'use strict'

import {card2SVG} from './drawcard.js'

/** @type {string} */
let nickname = '';
export let roomInfoAll = []
export let roomInfoBelong = [];
export let roomInfoWaiting = [];
let roomInfo = {}
/** @type {boolean} */
let is_addmin = false
/** @type {string[]} */

/**
 * @param {string} id 
 * @returns {HTMLElement}
 */
const getElementById = (id)=>{
    const ele = document.getElementById(id)
    if(ele==null) throw('null ele, id:'+id)
    return ele
}


(async ()=>{
    async function getname() {
        const $playerName = document.getElementById('playerName')
        const data = await fetchJSON('a/player/nickname','GET', {})
        console.log('[getname]1',data,$playerName,$playerName.textContent)
        $playerName.innerText = data.nickname//pX()
        nickname = data.nickname
        console.log('[getname]2',data,$playerName,$playerName.textContent)
        return data.nickname
    }
    await getname()

    // let changeflag = false
    const $changename = getElementById('changename')
    $changename.addEventListener('click',async e=>{

        async function check_valid(str) {
            if (!str.trim().length || rmStrangeStr(str) != str || str.length>10) return false
            try {
                const res = (await fetchJSON('a/player/checkName','POST', {nickname: str}))['valid']
                return res
            } catch (e) {
                console.log('f', e)
                return false
            }
        }

        const data = await myConfirm('이름 바꾸기','바꿀 이름을 입력하십시오.<br> 중복된 이름은 입력할 수 없습니다.',[
       {
        html: '<input id="newnickname" type="text">',
        id:'newnickname',
        checkfn:check_valid,
        filiter:(v)=>v,
        getdata:()=>document.getElementById('newnickname').value
       }])
            console.log('[myConfirm]',data)
       await fetchJSON('/a/player/changeNickname', { nickname: data['newnickname'] });
       console.log(await getname())
    })

})();

/**
 * 괴문자 제거
 * @param {string} str - 제거할 텍스트
 * @returns {string} - 괴문자 제거한 문자열
 */

function rmStrangeStr(str){ // 괴문자 제거. ex. 공백문자. 스프링 도배. 양 끝 공백도 제거
    return str.replace(/[\u0000-\u0008]|\u200b|[\u0e00-\u0e7f]|[\u0E80–\u0EFF]/gi,'').trim()
}

/**
 * 
 * @param {string} url - POST 요청을 보낼 주소
 * @param {"GET"|"POST"|"PUT"|"DELETE"} method - POST 요청을 보낼 주소
 * @param {any} obj  - 오청 내용
 * @returns  - json 파싱한 내용
 */
export async function fetchJSON(url,method="POST",obj={}){
    if(obj===undefined) obj = {};
    let data
    if(!['GET','HEAD'].includes(method)){
        data = await fetch(url,{
            method:method,
            body:JSON.stringify(obj, (key,value)=>(value==Infinity?'Infinity':value))
        })
    }else{
        let out = []
        let _URL = new URL(location)
        _URL.pathname = url
        for(const key in obj) _URL.searchParams.set(key,obj[key])
        data = await fetch(_URL.toString(),{
            method:"GET"
        })
    }
    if(data.status != 200) {
        if(data.status == 403) location=location
        console.error(`fetch ERROR ${data.status}\nurl:${url}\n obj:${JSON.stringify(obj)}\ndata:${await data.text()}`)
        throw('이상함')
    }
    const res = JSON.parse(await data.text())
    return res
}

const input_values = {}
window.input_values = input_values
function input_show_fn(namespace, $in, $out, 단위, sendfn = false){
    const c = ()=>$out.textContent = `${$in.value}${단위}`
    c()
    $in.addEventListener('change',c)
    $in.addEventListener('mousemove',c)
    $in.addEventListener('keypress',c)
    $in.addEventListener('keydown',c)
    $in.addEventListener('keyup',c)
    $in.addEventListener('change',()=>{
        input_values[namespace] = $in.value
        if(sendfn instanceof Function) sendfn() 
    })
}

function input_show_fn_inf(namespace, $in, $out, $inf,단위, sendfn = false){
    const c = ()=>{
        // console.log('c',c,$in, $inf, $in.disabled, $inf.disabled,)
        if($in.disabled&&$inf.disabled) return
        if($inf.checked ){
            $in.disabled = true
            $out.textContent = '무제한'
        }else{
            $in.disabled = false
            $out.textContent = `${$in.value}${단위}`
        }
}
    c()
    $in.addEventListener('change',c)
    $inf.addEventListener('change',c)
    $in.addEventListener('mousemove',c)
    $in.addEventListener('change',()=>{
        input_values[namespace] = $in.value
        if(sendfn instanceof Function) sendfn() 
    })
    $inf.addEventListener('change',()=>{
        input_values[namespace] = ($inf.checked ? Infinity : $in.value)
        if(sendfn instanceof Function) sendfn() 
    })
}


let lastsend = new Date()
function sendSetting(){
    const now = new Date()
    lastsend = now
    // console.log('[sendSetting - out], input_values:',input_values, now.toDateString())
    setTimeout(async ()=>{
        if((Number(lastsend)!=Number(now))) return false
        console.log('[sendSetting - in], timeout:',input_values, 'now:', Number(now),'last',Number(lastsend))
        const out = {
            bankruptcyNum:Number(input_values.bankruptcyNum),
            firstcardcount:Number(input_values.init_cnt),
            waitTime:Number(input_values.init_waittime),
        }
        // console.log('[sendSetting], input_values:',input_values, out)
        const data = await fetchJSON('a/room/setting','POST',{setting:out, roomId:roomInfo.id})
        console.log(data)
        lastsend = new Date()
    }, 100)
}
// let socket = 0
// export function set_io(_socket){
//     socket = _socket
//     status_game.io = socket
// }

/** @type {"roomlist"|"roomsetting"|"game"}*/
export let state = 'roomlist'
const $main = getElementById('main')
const $bar_dropdown = document.getElementById('bar_dropdown')
// 'roomlist', 'roomsetting', 'gmae'
export function pX(str){
    const ele = document.createElement('div')
    ele.textContent = str
    return ele.innerHTML
}


function isMe(somename, isOnlie=undefined, showInfo=false){
    // console.log('[isMe]',roomInfo)
    //showInfo: 나인지. 그리고 관리자인지 표시 여부.
    const isAdmin = (roomInfo?.nickname == somename) 

    const adminHTML = '<span class="badge rounded-pill bg-danger">관리자</span>'
    const meHTML = '<span class="badge rounded-pill bg-primary">나</span>'

    // if(somenickname == nickname) return `<span>${pX(somenickname)} ${meHTML}${admin?`<span class="badge rounded-pill bg-primary">Primary</span>`:''}</span>`
    if(isOnlie!==undefined) return `<span><span class="nicknamevalue">${pX(somename)}</span> ${somename==nickname?meHTML:''} ${isAdmin?adminHTML:''} ${isOnlie?'<span class="badge bg-success">O</span>':'<span class="badge rounded-pill bg-warning">X</span>'}</span>`
    else if(showInfo) return `<span><span class="nicknamevalue">${pX(somename)}</span> ${somename==nickname?meHTML:''} ${isAdmin?adminHTML:''} </span>`
    else return `<span><span class="nicknamevalue">${pX(somename)}</span> ${somename==nickname?meHTML:''}</span>`
}

/**
 * 현재 state에 알맞는 상태로 화면을 전환한다.
 */
function apply(){
    switch (state){
        case 'roomlist':
            if(status_game.status == 'stop') applyRoomlist()
            break
        case 'roomsetting':
            s_Roomsetting.apply()
            break
        case 'game':
            status_game.apply()
            break
        default:
            throw('이상한 모드')

    }
}
export async function applyRoomlist(){
    console.log('[applyRoomlist]',status_game.status)
    
    // console.log('kkkkkkkkkkkkkkk')

    const dp_list= [...$bar_dropdown.querySelectorAll('li>a')].map((v,i)=>{
        if(i==0) v.classList.add('active')
        else v.classList.remove('active')
    })
    //active
    

    state = 'roomlist'
    // if (state != 'roomlist') throw('state 맞지 않음')
    const applyRoomlist_HTML = await (await fetch('./s/roomlist.html')).text()
    if(state !== 'roomlist') {console.error('[applyRoomlist] state 바뀜'); return}
    $main.innerHTML = applyRoomlist_HTML
    $main.state = state


    const $btn_createroom = getElementById('btn_createroom')
    const $roomnameInput = getElementById('input_createroom')
    $btn_createroom.addEventListener('click', async () => {
        try {
            const roomData = await fetchJSON('/a/room','POST', { roomName: $roomnameInput.value })
            s_Roomsetting.apply(roomData, true)
        } catch (e) { console.log(`오류 e:${e}`) }
    });
    (() => {
        const $output = getElementById('output_createroom')
        async function check_valid(str) {
            if (!str.trim().length || rmStrangeStr(str) != str) return false
            try {
                const res = (await fetchJSON('a/room/checkName','POST', {
                        roomName: str
                    }))['valid']
                return res
            } catch (e) {
                console.log('f', e)
                return false
            }
        }
        const c = async ()=>{
            const flag = await check_valid($roomnameInput.value)
            $btn_createroom.disabled = !flag
            // $output.textContent = flag
            if(flag) $output.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="green"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`
            else $output.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"  fill="red"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'

            // $output.value = flag
        }
        $roomnameInput.addEventListener('keydown',()=>{$output.textContent = '...'; $btn_createroom.disabled = true})
        $roomnameInput.addEventListener('keyup',c)
        $roomnameInput.addEventListener('change',c)
        c()
    })()

    async function getroomlistBelong(){
        updateJoinroomList(
            await fetchJSON('a/room/belongList','GET',{}),
            await fetchJSON('a/room/waitingList','GET',{}))
        
    }
   
    async function getroomlistAll(){
        updateRoomList(await fetchJSON('a/room/allList','GET',{}))
    }

    await getroomlistBelong()
    await getroomlistAll()

}



async function updateRoomgamesetting(setting){
    for(const key in setting){
        if(setting[key] == 'Infinity') setting[key] = Infinity
    }
    console.log('[updateRoomgamesetting]',setting,is_addmin)
    // getSetting
    const mychangeEvent = new Event('mousemove')
    const $init_cnt = document.getElementById('init_cnt')
    if(!$init_cnt) {throw('설정창에 없음')}
    const $bankruptcyNum = document.getElementById('bankruptcyNum')
    const $init_waittime = document.getElementById('init_waittime')
    const $init_waittime_inf = document.getElementById('init_waittime_inf')
    $init_cnt.value = setting.firstcardcount
    $bankruptcyNum.value = setting.bankruptcyNum

    lastsend = new Date()
    if(setting.waitTime===Infinity){
        $init_waittime_inf.checked = true
        $init_waittime.disabled = true
    }else{
        if(is_addmin)  {
            $init_waittime.disabled = false
            $init_waittime_inf.checked = false
        }
        $init_waittime.value = setting.waitTime
        $init_waittime.dispatchEvent(mychangeEvent)
    }
    $init_waittime.value = setting.waitTime

    // input_values.bankruptcyNum = setting.bankruptcyNum
    // input_values.init_cnt = setting.firstcardcount
    // input_values.init_waittime = setting.waitTime
    $init_cnt.dispatchEvent(mychangeEvent)
    $bankruptcyNum.dispatchEvent(mychangeEvent)
    $init_waittime_inf.dispatchEvent(mychangeEvent)
}



async function roomMemverEvent(mode,nickname){
    console.log('[roomMemverEvent], [mode]',mode, mode=="참여")
    const roomid = roomInfo.id
    if(roomid===undefined)throw('잘못된 방 ID')


    nickname = decodeURIComponent(nickname)
    if(mode=="수락"){
        return await fetchJSON('a/room/join/list','PUT',{roomId:roomid, nickname});
    }else if(mode=="참여"){
        console.log('참여참여')
        s_Roomsetting.participantsName = [...s_Roomsetting.participantsName,nickname]
        console.log('[roomMemverEvent]2',nickname)
        return await fetchJSON('a/room/join/participants','PUT',{roomId:roomid});

    }else if(mode=="강퇴"){
        return fetchJSON('a/room/join/list','DELETE',{roomId:roomInfo.id, nickname});
    }else if(mode=="위"){
        const index = s_Roomsetting.participantsName.indexOf(nickname)
        if(index>0) [s_Roomsetting.participantsName[index], s_Roomsetting.participantsName[index-1]] = [s_Roomsetting.participantsName[index-1],s_Roomsetting.participantsName[index]]
        else {console.log('participants_list',s_Roomsetting.participantsName);throw('잘못된 위치에서 요청됨, 위, ')}
        updateParticipantsInfo()
        return await fetchJSON('a/room/join/participants','POST',{roomId:roomid,participants:s_Roomsetting.participantsName});
    }else if(mode=="아래"){
        const index = s_Roomsetting.participantsName.indexOf(nickname)
        if(index<=s_Roomsetting.participantsName.length-2) [s_Roomsetting.participantsName[index], s_Roomsetting.participantsName[index+1]] = [s_Roomsetting.participantsName[index+1], s_Roomsetting.participantsName[index]]
        else {console.log('participants_list',s_Roomsetting.participantsName);throw('잘못된 위치에서 요청됨, 아래, ')}
        updateParticipantsInfo()
        return await fetchJSON('a/room/join/participants','POST',{roomId:roomid,participants:s_Roomsetting.participantsName});
    }else if(mode=='취소'){
        // 참여자 목록에서 제외
        const index = s_Roomsetting.participantsName.indexOf(nickname)
        s_Roomsetting.participantsName.splice(index,1)
        updateParticipantsInfo()
        return await fetchJSON('a/room/join/participants','DELETE',{roomId:roomid, playerIndex:index})
    }
    else{
        console.error(`이상한 mode: ${mode}`)
        throw(`이상한 mode: ${mode}`)
    }
}
window['roomMemverEvent'] = roomMemverEvent



function updateInitcntMax(){
    document.getElementById('init_cnt')&&(document.getElementById('init_cnt').max = parseInt(Math.min(27,55/s_Roomsetting.participantsName.length)))
}



/**
 * room 설정창에 있는 모든 사람들의 정보를 화면에 업데이트한다.
 * @param {{waitList:any, memberList:any, participants:any}} memberInfo 
 * @returns 
 */
 async function updateMemberInfo(memberInfo){
    if(state!=='roomsetting') return

    if($main.state != 'roomsetting') throw('[updateMemberInfo] not roomsetting')

    // console.log('[memberInfo]',memberInfo)
    const $participants_list = getElementById('participants_list')
    const $member_list = getElementById('member_list')
    // const $wait_list = getElementById('wait_list')
    s_Roomsetting.participants = memberInfo.participants//.map(v=>v.nickname)
    updateInitcntMax()

    if(is_addmin){
        // $wait_list.innerHTML = `<table class="table table-hover"><thead><tr><th>닉네임</th><th>온라인</th><th></th><tbody>`
        // +memberInfo.waitList.map(v=>`<tr><td class="nickname"><b>${pX(v.nickname)}</b></td> <td>${v.isOnlie}</td><td> <button class="btn btn-outline-secondary" onclick=roomMemverEvent("수락","${encodeURIComponent(v.nickname)}")>수락</button></td></tr>`).join('\n')+`</tbody></table>`
        $member_list.innerHTML = `<table class="table table-hover"><thead><tr><th>닉네임</th><th>설정</th><tbody>`
        +memberInfo.waitList.map(v=>`<tr><td class="nickname">${isMe(v.nickname, v.isOnlie)}</td><td><button class="btn btn-outline-secondary" onclick=roomMemverEvent("수락","${encodeURIComponent(v.nickname)}")>수락</button></td></tr>`).join('\n')
        +memberInfo.memberList.map(v=>
            `<tr><td class="nickname">${isMe(v.nickname, v.isOnlie)}</td><td>`
            + (v.nickname==nickname ? `<button class="btn btn-outline-secondary" onclick=roomMemverEvent("참여","${encodeURIComponent(v.nickname)}") ${s_Roomsetting.participantsName.includes(v.nickname)?'disabled':''}>참여</button> ` : ` `)
            + (v.nickname==nickname?'':`<button class="btn btn-outline-danger"  onclick=roomMemverEvent("강퇴","${encodeURIComponent(v.nickname)}")>강퇴</button>`)
            +`</td></tr>`
        ).join('\n')+`</tbody></table>`

        
    }else{
        // $wait_list.innerHTML = `<table class="table table-hover"><thead><tr><th>닉네임</th><th>온라인</th><tbody>`
        // +memberInfo.waitList.map(v=>`<tr><td class="nickname">${pX(v.nickname)}</td> <td>${v.isOnlie}</td></tr>`).join('\n')+`</tbody></table>`
        $member_list.innerHTML = `<table class="table table-hover"><thead><tr><th>닉네임</th><th>설정</th><tbody>`
        +memberInfo.waitList.map(v=>`<tr><td class="nickname">${isMe(v.nickname, v.isOnlie)}</td><td>가입 요청됨</td></tr>`).join('\n')
        +memberInfo.memberList.map(v=>`<tr><td class="nickname">${isMe(v.nickname, v.isOnlie)}</td><td>`
            +(v.nickname==nickname ? `<button class="btn btn-outline-secondary" onclick=roomMemverEvent("참여","${encodeURIComponent(v.nickname)}") ${s_Roomsetting.participantsName.includes(v.nickname)?'disabled':''}>참여</button> ` : ` `)
            +`</td></tr>`).join('\n')+`</tbody></table>`
             
        
    }

}

/**
 * 참여자 목록을 업데이트
 */
function updateParticipantsInfo(){
    if(state != 'roomsetting') {console.error('[updateParticipantsInfo] state 안맞어, state:',state); throw('state 안맞어')}
    const $participants_list = getElementById('participants_list')
    const $tbody = $participants_list.querySelector('tbody')
    const ch_list = [...$tbody.children]
    if(!ch_list || ch_list.length == 0) throw('길이 없ㅇ므')
    const nicknameList = ch_list.map(c=>c.getElementsByClassName('nicknamevalue')[0].textContent)
    console.log('[updateParticipantsInfo], ch_list,',ch_list,nicknameList,s_Roomsetting.participantsName)
    // const indexList = nicknameList.map(name=>participants_list.indexOf(name))
    
    ch_list.forEach(element => {
        element.remove()
    });

    console.log('participants_list',s_Roomsetting.participantsName,'ch_list',ch_list,'nicknameList',nicknameList)
    for(let i=0; i<s_Roomsetting.participantsName.length; i++){
        let index = nicknameList.indexOf(s_Roomsetting.participantsName[i])
        $tbody.appendChild(ch_list[index])
    }

}


 function updateJoinroomList(roominfo_joined, roominfo_waiting){
    roomInfoBelong = roominfo_joined
    roomInfoWaiting = roominfo_waiting
    if (state != 'roomlist') {console.error('[updateJoinroomList] state 맞지 않음'); return}
    console.log('[updateJoinroomList]','roominfo_joined',roominfo_joined, 'roominfo_waiting',roominfo_waiting)
    const $roomlistBelong = getElementById('roomlistBelong')
    // const $roomlistWaiting = getElementById('roomlistWaiting')


    $roomlistBelong.innerHTML = (roominfo_joined.length|roominfo_waiting.length)? `<table class="table table-hover"><thead><tr><th>방 이름</th><th>인원</th><th>지난 게임</th><th>방장</th><th>설정</th><tbody>`+roominfo_joined.map(v=>
        `<tr><td><b>${pX(v.roomName)}</b></td><td>${v.memberln}</td><td>${v.lastGameDate==null?'-':(new Date(v.lastGameDate)).toLocaleString()}</td><td>${isMe(v.nickname)}</td><td> `
        +`<button class="btn btn-outline-secondary" onclick=roomevent("${v.id}","${v.nickname == nickname ? 'setup_admin':'setup'}")>설정</button> `
        + (v.nickname == nickname ? '' : `<button class="btn btn-outline-danger" onclick=roomevent("${v.id}","withdraw")>탈퇴</button>  `)
        +`</td></tr>`).join('\n')
        +roominfo_waiting.map(v=>`<tr><td><b>${pX(v.roomName)}</b></td> <td>${v.memberln}</td><td>${v.lastGameDate==null?'-':(new Date(v.lastGameDate)).toLocaleString()}</td><td>${pX(v.nickname)}</td><td>수락 대기중</td><tr>`).join('\n')+'</tbody></table>':'초대 수락 대기중인 방 목록이 없습니다'
        // +'</tbody></table>':'속해 있는 방 목록이 없습니다'
        // $roomlistWaiting.innerHTML = roominfo_waiting.length?`<table class="table table-hover"><thead><tr><th>방 이름</th><th>방장</th><tbody>`

}

 function updateRoomList(roominfo){
    roomInfoAll = roominfo
    console.log('[updateRoomList]','roomInfoWaiting:',roomInfoWaiting,'roomInfoBelong:',roomInfoBelong,'roominfo:',roominfo)//,roominfo[0].id,roomInfoWaiting.some(vv=>vv.id==roominfo[0].id),roomInfoBelong.some(vv=>vv.id==roominfo[0].id))
    if (state != 'roomlist') {console.error('[updateRoomList] state 맞지 않음'); return}
    const $roomlistAll = getElementById('roomlistAll')
    $roomlistAll.innerHTML = roominfo.length ?  `<table class="table table-hover"><thead><tr><th>방 이름</th><th>인원</th><th>지난 게임</th><th>방장</th><th></th><tbody>`+roominfo.map(v=>
        `<tr><td><b>${pX(v.roomName)}</b></td> <td>${v.memberln}</td><td>${v.lastGameDate==null?'-':(new Date(v.lastGameDate)).toLocaleString()}</td><td>${isMe(v.nickname)}</td><td> `
        +((roomInfoWaiting.some(vv=>vv.id==v.id)||roomInfoBelong.some(vv=>vv.id==v.id))?'':`<button class="btn btn-outline-secondary"  onclick=roomevent("${v.id}","join")>가입</button>`)
        +`</td></tr>`).join('\n')+'</tbody></table>':'생성된 방 목록이 없습니다'
    
}

async function roomevent(roomId,mode){
    if(mode=='join'){ //가입
        if(!roomInfoAll.some(v=>v.id == roomId)) throw('없는 방')
        const data = await fetchJSON('a/room/join/waitlist','PUT',{roomId})
        roomInfoWaiting.push(roomInfoAll.filter(v=>v.id==roomId)[0]) // 대기실 목록에 추가
        console.log('[roomevent]',data,roomInfoWaiting,roomInfoBelong,roomInfoAll)
        updateJoinroomList(roomInfoBelong,roomInfoWaiting)
        updateRoomList(roomInfoAll)
    }
    else if(mode=='setup'){
        if(!roomInfoBelong.some(v=>v.id == roomId)) throw('없는 방')
        const room = roomInfoBelong.filter(v=>v.id == roomId)[0]
        s_Roomsetting.apply(room, false)
    }else if(mode=='setup_admin'){
        if(!roomInfoBelong.some(v=>v.id == roomId)) throw('없는 방')
        const room = roomInfoBelong.filter(v=>v.id == roomId)[0]
        s_Roomsetting.apply(room, true)
    }else if(mode=='withdraw'){ //탈퇴
        if(!roomInfoBelong.some(v=>v.id == roomId)) throw('없는 방')
        const room = roomInfoBelong.filter(v=>v.id == roomId)[0]
        if(!roomInfoAll.some(v=>v.id == roomId)) throw('없는 방')
        const data = await fetchJSON('a/room/join/list','DELETE',{roomId})
        console.log('[withdraw]',data)
        const r = roomInfoBelong.filter(v=>v.id==roomId)[0]
        roomInfoBelong.splice(roomInfoBelong.indexOf(r),1)
        updateJoinroomList(roomInfoBelong,roomInfoWaiting)
        updateRoomList(roomInfoAll)
    }else throw('잘못된 모드:'+mode)
}
window.roomevent = roomevent



function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const rp = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[rp];
      arr[rp] = tmp;
    }
  }


async function updateRecords(){
    if(state!=='roomsetting') return

    const $records = getElementById('records')
    const roomid = roomInfo.id
    const data = await fetchJSON('a/room/records','GET',{roomId:roomid})
    // console.log('[updateRecords]',data)
    class countList{
        constructor(){
        this.out = {}
        this.score = 0
      }
        add(key){
        if(this.out[key]) this.out[key]+=1;
    else this.out[key] = 1
    this.score += 2**(-(key-1))
    
    return this.out;
    }
    }

    let 최대등수 = 1
    // $records.innerHTML = JSON.stringify(data)//data.map(v=>`<div>${JSON.stringify(v)}</div>`).join('\n')
    const out = {}
    const playerList = []
    for (let play of data){
        play.forEach(p=>{
            const {player, rank} = p;
            최대등수 = Math.max(최대등수, rank)
            const pstring = player.nickname
            if(out[pstring]===undefined) out[pstring] = new countList()
            out[pstring].add(rank)
        })
    }
    let outHTML = `<table class="table table-hover"><thead><tr><th>닉네임</th><th><span id="tooltip_score" data-toggle="tooltip" title="각 게임별 (½)<sup>(순위)</sup>의 합계">승점</span></th>${(new Array(최대등수)).fill(1).map((v,i)=>`<th>${i+1}등</th>`).join('')}<tbody>`
    for (const playerName in out) {playerList.push({name:playerName, score:out[playerName].score})}
    playerList.sort((a,b)=>a.score<b.score)
    for (const {name,score} of playerList){
        const 기록 = out[name].out
        let outdata = (new Array(최대등수)).fill(1).map((v,i)=>`<td>${기록[i+1]?기록[i+1]:0}회</td>`).join('')
        outHTML+=`<tr><td>${isMe(name,undefined,true)}</td><td>${parseFloat(score).toFixed(3)}</td>${outdata}</tr>`
    }
    outHTML += `</tbody></table>`
    // console.log('[updateRecords]',outHTML, data, out)
    $records.innerHTML = outHTML
    const ele = document.getElementById('tooltip_score')
    if(ele) new bootstrap.Tooltip(ele, {html:true})

}


export class Status_roomsetting{
    
    /** @type {{nickname:string,isOnlie:boolean}[]} */
    __participants
    /** @type {string[]} */
    __participantsName
    /** @type {boolean} */
    is_addmin
    /** @type {{id:string,nickname:string,roomName:string}|{}} */
    roomInfo
    constructor(){
        /** @type {string[]} */
        this.__participants = []
        this.__participantsName = []
        this.tooltip = null
        this.is_addmin = false
        this.roomInfo = {}
    }

    set participantsName(ar){
        if(!Array.isArray(ar)) throw('12')
        if(!ar.every(v=>typeof v == 'string')) throw('문자만 든 배열이 아님')
        this.__participantsName = ar
         this.gamebuttoncheck()
    }

    set participants(ar){
        console.log('[set participants]',ar, ar.map(v=>v.nickname))
        if(!Array.isArray(ar)) throw('12')
        this.__participants = ar
        this.participantsName = ar.map(v=>v.nickname)
        const $participants_list = document.getElementById('participants_list')

        if(is_addmin){
            $participants_list.innerHTML = `<table class="table table-hover"><thead><tr><th>닉네임</th><th></th><tbody>`
        +this.__participants.map((v,i)=>`<tr><td class="nickname">${isMe(v.nickname, v.isOnlie)}</td><td>`+
            (i==0? ' ' : `<button class="btn btn-outline-secondary"  onclick=roomMemverEvent("위","${encodeURIComponent(v.nickname)}")>위</button> `)+
            (i==s_Roomsetting.participantsName.length-1 ? ' ' : `<button class="btn btn-outline-secondary" onclick=roomMemverEvent("아래","${encodeURIComponent(v.nickname)}")>아래</button> `)+
            `<button class="btn btn-outline-secondary" onclick=roomMemverEvent("취소","${encodeURIComponent(v.nickname)}")>취소</button>
            </td></tr>`).join('\n')+`</tbody></table>`
        }else{
            $participants_list.innerHTML = `<table class="table table-hover"><thead><tr><th>닉네임</th><th></th><tbody>`
            +this.__participants.map(v=>`<tr><td class="nickname">${isMe(v.nickname, v.isOnlie)}</td><td>`
            +(v.nickname==nickname ? `<button class="btn btn-outline-secondary" onclick=roomMemverEvent("취소","${encodeURIComponent(v.nickname)}")>취소</button>`:'')
            +`</td></tr>`).join('\n')
        }

    }

    get participants(){
        return this.__participants
    }

    get participantsName(){
        return this.__participantsName
    }


    async apply(roomData, 방장여부){
        console.log('[apply]',roomData, 방장여부)
        roomInfo = roomData
        this.roomInfo = roomData
        is_addmin = 방장여부
        this.is_addmin = is_addmin
    
        // const dp_list= [...$bar_dropdown.querySelectorAll('li>a')].map((v,i)=>{
        //     if(i==1) v.classList.add('active')
        //     else v.classList.remove('active')
        // })
    
        // if (state != 'roomsetting') throw('state 맞지 않음')
        state = 'roomsetting'
        $main.innerHTML = await (await fetch('./s/roomsetting.html')).text()
        $main.state = state
        const $init_roomname = getElementById('init_roomname')
        $init_roomname.value = roomData.roomName
        const $btn_backlist = getElementById('btn_backlist')
        const $start_game = getElementById('start_game')
        const $btn_participantsShuffle = getElementById('btn_participantsShuffle')
        input_show_fn('init_cnt',getElementById('init_cnt'), getElementById('output_init_cnt'), '장', is_addmin?sendSetting:false)
        input_show_fn('bankruptcyNum',getElementById('bankruptcyNum'), getElementById('output_bankruptcyNum'), '장', is_addmin?sendSetting:false)
        input_show_fn_inf('init_waittime',getElementById('init_waittime'), getElementById('output_init_waittime'), getElementById('init_waittime_inf'), '초', is_addmin?sendSetting:false)
        input_show_fn('init_roomname', $init_roomname, getElementById('output_roomname'), '')
        $btn_backlist.addEventListener('click',()=>{console.log('wdw'); applyRoomlist();})
        getElementById('bankruptcyNum').addEventListener('change',()=>{
            if(Number(getElementById('bankruptcyNum').value) - Number(getElementById('init_cnt').value) <= 0) {
                getElementById('bankruptcyNum').value  = Number(getElementById('init_cnt').value)+1
                getElementById('bankruptcyNum').dispatchEvent(new Event('change'))
            }
        })
        lastsend = new Date()
        $btn_participantsShuffle.addEventListener('click',async ()=>{shuffle(s_Roomsetting.participantsName); await fetchJSON('a/room/join/participants','POST',{participants:s_Roomsetting.participantsName, roomId:roomData.id})})
        $start_game.addEventListener('click',()=>{status_game.start()})
    
        fetchJSON('a/room/members','GET',{roomId:roomData.id}).then(updateMemberInfo)
    
        fetchJSON('a/room/setting','GET',{roomId:roomData.id}).then(updateRoomgamesetting)
    
        function add_onlyforadmin_tooltip(ele){
            if(!ele) return
            ele = ele.parentElement
            if(ele.attributes['data-bs-toggle']) return
            ele.setAttribute('data-bs-toggle','tooltip')
            ele.title = '관리자 전용'
            const tp = new bootstrap.Tooltip(ele, {})
            // console.log(tp)
        }
    
        if(방장여부 === false){
            const ar = $main.getElementsByTagName('input')
            if(ar) [...ar].map($in=>{
                $in.disabled = true
                add_onlyforadmin_tooltip($in)
            })
            const br = $main.getElementsByTagName('button')
            if(br) [...br].map($in=>{ if(!['btn_backlist'].includes($in.id)) {
                $in.disabled = true
                add_onlyforadmin_tooltip($in)
            }})
    
            $btn_participantsShuffle.disabled = true
            $start_game.disabled = true
            console.log('[$start_game] 비활성화',$start_game,$start_game.disabled)
            
        }
    
        
        this.gamestar_btn_tooptip_setting()
    
        updateRecords()
    }

    /**
     * @access private
     * @returns 
     */
    gamebuttoncheck(){
        if(state != 'roomsetting') return
        if(this.is_addmin === false) return
        console.log('[gamebuttoncheck]', this.participantsName, this.participantsName.length,this.is_addmin)
        const $btn_start_game = document.getElementById('start_game')
        $btn_start_game.disabled =  this.participantsName.length<2

        if(this.__participants.length && this.__participants.length<2 && this.tooltip==null)
            this.tooltip = new bootstrap.Tooltip(ele, {})
        else if(this.__participants.length>=2 && this.tooltip!=null){
            this.tooltip.dispose()
            this.tooltip = null
        }
    }

    gamestar_btn_tooptip_setting(){
        if(state != 'roomsetting') return
        console.log('[gamestar_btn_tooptip_setting]')
        if(bootstrap){
            const ele = document.getElementById('start_game_toggle')
            if(!is_addmin) ele.title = '관리자 전용'
            if(is_addmin) ele.title = '게임 참여자 2명 이상 필요함'
            if(this.__participants && this.__participants.length<2)
                this.tooltip = new bootstrap.Tooltip(ele, {})
        }
    }

}

export  class Status_game{
    /**
     * 현재 게임의 상태를 관리하는 함수
     * @param {socket} io - Socket.io 객체
     */

    io;
    cardList;
    eventlist;
    order
    status
    lastcard
    thisOrderPlayerDroped
    먹일카드
    html
    ranking
    remainCards
    myOrder
    isbankrupt
    lastChangeTurnTime
    waitTime

    constructor(io){
        /** @access private */
        this.io = io
        /** @access private */
        this.cardList = []
        /** @access private */
        this.eventlist = []
        /** @access private @type {number}*/
        this.order = -1
        /** @access private  @type {"stop"|"start"|"bankrupt"}*/
        this.status = "stop"
        /** @access private */
        this.lastcard = null //직전에 낸 카드
        this.먹일카드 = 0
        this.thisOrderPlayerDroped = false
        this.ranking = []
        this.remainCards = (new Array(s_Roomsetting.participantsName.length)).fill(7)
        this.myOrder = -1
        this.lastChangeTurnTime = -1
        this.waitTime = Infinity
        this.html = new Promise(res=>{
            fetch('./s/game.html').then(data=>data.text()).then(html=>{
                this.html = html
                res(false)
            })
        })
        this.isbankrupt = false

        this.interactive = {
            tackedEle:null,
            aftertaskEle:undefined, //다음 노드를 가리킴
            clkofst:null,
            myPos:null,
            divs:[],
            cardList:[],
            sepByHeight:  (ar)=>{
                const out = {}
                const outname = []
                for (const i of ar) {
                    if (out[i[1]] === undefined) { out[i[1]] = [i]; outname.push(i[1]) }
                    else out[i[1]].push(i)
                }
                outname.sort((a, b) => a > b)
                return outname.map(id => out[id].sort((a, b) => a[0] > b[0]))
            },
            checkLineOverlap : (a, b, x, y, d = 0)=>{ // 겹치면 true 반환. 접촉은 겹치는 것으로 취급 안함.
                //d: 겹침을 얼마나 봐줄 것인가.
                // console.log('[checkLineOverlap]',a,b,x,y)
                if (a < x) return (b - x) > d
                else return (y - a) > d
            }
        }

        io.on('askColor',this.askColor)
        io.on('changeTurn',(data)=>{
            console.log('[cio, hangeTurn]',data)
            //이 응답이 왔다는 것은 게임이 시작되었음을 이야기함
            if(s_Roomsetting.participantsName.length==0){
                console.error('participants_list이 빈 관계로 진행 X')
                return;
            }
            if(state!='game') this.apply()
            console.log('[io, changeTurn]',data); 
            
            this.applyTurn(data);
        })
        io.on('changeCard',(data)=>{
            console.log('[io, changeCard]',data)
            this.applyCard(data)
        })
        io.on('startGame', data=>{
            //게임 시작 버튼을 눌렀을 때 트리거
            console.log('[io, startGame]',data)
            s_Roomsetting.participantsName = data.participants
            updateInitcntMax()
            
            this.apply()

        })
        io.on('changeLastCard',resData=>{
            console.log('[io, changeLastCard]',resData)
            const {card, 먹일카드} = resData
                
            //카드 개수 변경 확인
            this.remainCards[this.order] -= 1 // 카드 바뀜
            this.updateRanking()

            getElementById('present_card').innerHTML = this.printCard(card)
            getElementById('먹일카드').innerHTML = `${먹일카드}장`

        })

        io.on('drawCardChange',resData=>{
            console.log('[io, drawCardChange]',resData)
            const {order} = resData
            //카드 개수 변경 확인
            this.remainCards[order] += 1 // 카드 바뀜
            this.updateRanking()
        })


        io.on('changeRanking',ranking=>{
            console.log('[io, changeRanking]',ranking)
            this.ranking = ranking
            this.updateRanking()
        })
        
        io.on('gameStarted',async data=>{ // 방장에 의해 게임이 시작되었음을 알림
            console.log('io, gameStarted]',data,'wttime',(data.waitTime===null||data.waitTime==Infinity)?Infinity:Number(data.waitTime))
            this.status = 'start'
            roomInfo =  data.roomInfo
            s_Roomsetting.participantsName = data.participants
            
            this.waitTime = (data.waitTime===null||data.waitTime==Infinity)?Infinity:Number(data.waitTime)
            updateInitcntMax()
            this.remainCards = data.remainCards
            this.myOrder = s_Roomsetting.participantsName.indexOf(nickname)

            if(state !== 'game') {
                this.apply()
                const info = await fetchJSON('a/game/info','GET',{})
                status_game.applyTurn(info)
             }

        })

        io.on('stateChange',state=>{
            console.log('[io, stateChange]',state)
            this.status = state

            if(state == 'ended'){
                // alert('게임 종료!!')
                myConfirm('게임 종료됨','게임이 종료되었습니다. <br>설정 화면으로 이동합니다',[]).then(()=>{
                    s_Roomsetting.apply(roomInfo, is_addmin)
                })
                // 요약하는 글 보여주기
                // 내 등수 보여주가
                // 세팅 화면으로 들어가기
            }
            this.updateRanking()
        })

        
        //인터렉티브 관련
        const it = this.interactive
        

        const movefn = e => {
            if (it.tackedEle === null) return;
            const $myCards = document.getElementById('myCards')
            const $bar1 = document.getElementById('bar1')

            const musPos = [e.pageX, e.pageY]
            // console.log('[pos]',musPos,it.clkofst)
            it.myPos = [-it.clkofst[0] + musPos[0], -it.clkofst[1] + musPos[1]]


            // console.log(tackedEle, clkofst, musPos)
            it.tackedEle.style.position = 'absolute'

            it.tackedEle.style.left = it.myPos[0] + 'px'
            it.tackedEle.style.top = it.myPos[1] + 'px'


            // 현재 카드 위치가 drop zone인지 cardlist인지 구분해야함.
            // cardlist면 빈 객체를 적당히 끼워넣을 필요가 있음

            it.divs.map(v => {
                v.style.paddingLeft = ''
                v.style.paddingRight = ''
            })

            const 봐주기 =  it.btn_size[1] / 2 - 10


            if ($myCards.offsetTop - it.btn_size[1] < it.myPos[1]-봐주기) {
                $bar1.style.backgroundColor = ''

                // console.log('type: 객체 내부 =============')


                let floar = 0
                it.aftertaskEle = null
                while (true) {

                    const sph = it.sepByHeight(it.divs.filter(e => e !== it.tackedEle).map(v => [v.offsetLeft, v.offsetTop, v]))
                    if (sph.length <= floar) break;
                    const dvlist = sph[floar]

                    // console.log('dvl', dvlist, sph)
                    if (it.checkLineOverlap(dvlist[0][1], dvlist[0][1] + it.btn_size[1], it.myPos[1], it.myPos[1] + it.btn_size[1], 봐주기)) {

                        //겹침
                        // console.log('겹침 fL', floar)

                        for (let cnt in dvlist) {
                            const elePos = dvlist[cnt]
                            if (elePos[0] + it.btn_size[0] > it.myPos[0]) {

                                if (cnt == 0) {
                                    const padEle = dvlist[0]
                                    // console.log('ele - p', padEle, elePos)
                                    padEle[2].style.paddingLeft = Math.max(0, Math.min(it.btn_size[0] * 2, it.myPos[0] - padEle[0] + it.btn_size[0])) + 'px'
                                    if (it.aftertaskEle == null || (padEle[1] - it.myPos[1] < it.btn_size[1] / 2)) it.aftertaskEle = padEle[2]
                                    // console.log(padEle[1], it.myPos[1], it.btn_size[1] / 2)
                                } else {
                                    const padEle = dvlist[cnt - 1]
                                    // console.log('ele ok', padEle, elePos)
                                    const pd = Math.max(0, Math.min($myCards.clientWidth - padEle[0] - it.btn_size[0], it.myPos[0] - padEle[0]))
                                    if (pd > it.btn_size[0] * 2) {
                                        // console.log('벗어남')
                                        elePos[2].style.paddingRight = pd - it.btn_size + 'px'
                                    }
                                    else {
                                        padEle[2].style.paddingRight = pd + 'px'
                                    }
                                    if (it.aftertaskEle == null || (padEle[1] - it.myPos[1] < it.btn_size[1] / 2)) it.aftertaskEle = elePos[2]
                                    // console.log(padEle[1], it.myPos[1], it.btn_size[1] / 2)
                                }
                                break;
                            }
                        }
                    }
                    floar += 1
                }
                return;
            } else {
                it.aftertaskEle = undefined
                // console.log('mv',$bar1.offsetTop, $bar1.offsetTop+$bar1.offsetHeight, it.myPos[1], it.myPos[1] + it.btn_size[1]);
                if (
                    it.checkLineOverlap($bar1.offsetLeft, $bar1.offsetLeft+$bar1.offsetWidth, it.myPos[0], it.myPos[0] + it.btn_size[0]) &&
                    it.checkLineOverlap($bar1.offsetTop, $bar1.offsetTop+$bar1.offsetHeight, it.myPos[1], it.myPos[1] + it.btn_size[1])
                ) {
                    console.log('카드를 냄?',e)
                    $bar1.style.backgroundColor = 'gray'
                }
            }

        }
        const endfn =  async e => {
            if (it.tackedEle === null) return;
            const $myCards = document.getElementById('myCards')
            const $bar1 = document.getElementById('bar1')
            it.tackedEle.style.position = ''

            it.tackedEle.style.left = ''
            it.tackedEle.style.top = ''
            console.log(e)

            it.divs.map(v => {
                v.style.paddingLeft = ''
                v.style.paddingRight = ''
            })


            console.log('type: 객체 내부 for', 'tackedEle', it.tackedEle, 'aftertaskEle', it.aftertaskEle)


            if (it.aftertaskEle) {
                it.tackedEle.remove()
                $myCards.insertBefore(it.tackedEle, it.aftertaskEle)
            } else if (it.aftertaskEle === null) {
                it.tackedEle.remove()
                $myCards.append(it.tackedEle)
            } else {
                //안겹치는 부분

                if (
                    it.checkLineOverlap($bar1.offsetLeft, $bar1.offsetLeft+$bar1.offsetWidth, it.myPos[0], it.myPos[0] + it.btn_size[0]) &&
                    it.checkLineOverlap($bar1.offsetTop, $bar1.offsetTop+$bar1.offsetHeight, it.myPos[1], it.myPos[1] + it.btn_size[1])
                ) {
                    $bar1.style.backgroundColor = ''
                    // it.tackedEle.click()
                    const card = JSON.parse(it.tackedEle.attributes['card-data'].value )
                    console.log('카드를 냄, card',card)
                    const cd = it.tackedEle
                    it.tackedEle = null
                    try{
                        await this.wrapDropCard(card)
                        cd.remove()
                    }catch(e){
                        console.log('카드를 낼 수 없음,'+e)
                        it.tackedEle = cd
                    }

                }

            }

            // }

            it.tackedEle = null
            it.clkofst = null
            it.myPos = null
            it.aftertaskEle = undefined

        }
        document.addEventListener('mousemove', movefn)
        document.addEventListener('touchmove', e=>{
            if(!it.tackedEle) return;
            // e.preventDefault(); 
            // e.stopPropagation();
            movefn(e);
        }
        )
        document.addEventListener('mouseup',endfn)
        document.addEventListener('touchend',()=>{
            $scrollmain.style.overflowY = ''
            endfn()
        })
        document.addEventListener('touchcancel',()=>{
            $scrollmain.style.overflowY = ''
            if (it.tackedEle === null) return;
            
            it.divs.map(v => {
                v.style.paddingLeft = ''
                v.style.paddingRight = ''
            })
            it.tackedEle = null
            it.clkofst = null
            it.myPos = null
            it.aftertaskEle = undefined
        })



        const $scrollmain = document.getElementById('scrollmain')
        // $scrollmain.addEventListener('scroll', (e) => {
        //     // if (it.tackedEle === null) return;
        //     console.log('scr')
        //     e.preventDefault(); 
        //     e.stopPropagation();

        //     // Get the current page scroll position
        //     // $scrollmain.scrollTo(0,0);

        // })


    }


    async start(){
        //관리자용 함수
        //게임을 시작시킴
        if(s_Roomsetting.participantsName.length == 1){
            alert('1명이서 게임을 시작할 수 없습니다')
            return false
        }

        this.remainCards = (new Array(s_Roomsetting.participantsName.length)).fill(7)
        this.myOrder = s_Roomsetting.participantsName.indexOf(nickname)
        await fetchJSON('a/room/gameStart','POST',{roomId:roomInfo.id})
        this.apply()
    }

    /**
     * 게임 화면으로 상태를 전환
     * @public 
     * @returns {Promise<any>}
     */
    async apply(){
        state = 'game' //전역변수 설정
        this.status = 'start'


        const dp_list= [...$bar_dropdown.querySelectorAll('li>a')].map((v,i)=>{
            if(i==2) v.classList.add('active')
            else v.classList.remove('active')
        })

        if(s_Roomsetting.participantsName.length<=1) {
            console.error('참여인원이 적어 진행할수 없습니다',s_Roomsetting.participantsName)
            alert('참여인원이 적어 진행할수 없습니다'); 
            return false;}
        // const roomid = roomInfo.id
        if( $main.state == 'game') return
            
        // console.log('[apply]','this.html',this.html)
        
        $main.innerHTML = (typeof this.html == 'string')?this.html:((await this.html)||this.html )
        
        // console.log('[apply]','this.html2',this.html, $main.innerHTML)
        $main.state = state
        // console.log('this.html',this.html,this)

        // 게임
        getElementById('btn_askOnecard').addEventListener('click',()=>{
            this.io.emit('onecard.askoneCard');
        })
        const $btn_draw = getElementById('btn_draw')
        const $btn_turnChange = getElementById('btn_turnChange');
        $btn_draw.addEventListener('click',()=>{this.drawCard()});
        $btn_turnChange.addEventListener('click',()=>{this.turnCahnge()});

        // 초기화
        this.cardList = []

        // 내 순서일 때만 버튼 활성화
        const $myCards_btns = getElementById('myCards').getElementsByTagName('button')
        for(const btn of [$btn_draw, $btn_turnChange, ...$myCards_btns]) btn.disabled = !this.isMyOrder()


        fetchJSON('./a/game/mycards','GET',{}).then(cardList=>{this.cardList = cardList;this.applyCardList();})

        fetchJSON('a/game/ranking','GET',{}).then(ranking=>{
            console.log('[a/game/ranking]',ranking)
            this.ranking = ranking;
            this.updateRanking()
        })
    }
    /**
     * 색상을 물어봄
     * @private 
     */
    async askColor(){
        // console.log('#askColor')

        const ac = async()=>
            (await myConfirm('모양 선택','원하는 모양을 선택하십시오', [{
                html: `<div class="" id="askFigure">
                <input class="btn-check" type="radio" name="sultselect" id="sult0" autocomplete="off" checked>
                <label class="btn btn-outline-dark" for="sult0"> ♠ </label>
                <input class="btn-check" type="radio" name="sultselect" id="sult1" autocomplete="off" >
                <label class="btn btn-outline-dark" for="sult1"> ♣ </label>
                <input class="btn-check" type="radio" name="sultselect" id="sult2" autocomplete="off" >
                <label class="btn btn-outline-danger" for="sult2"> ♥ </label>
                <input class="btn-check" type="radio" name="sultselect" id="sult3" autocomplete="off" >
                <label class="btn btn-outline-danger" for="sult3"> ♦ </label>
            </div>`,
                id: 'askFigure',
                checkfn: false,
                getdata: () => ['♠', '♣', '♥', '♦'][['sult0', 'sult1', 'sult2', 'sult3'].map((v, i) => document.getElementById(v).checked ? i : false).filter(v => v !== false)[0]]
            }]))['askFigure']
        

        let sult = await ac()
        console.log('sult',sult)
        while(!['♠','♣','♥','♦'].includes(sult)) sult = await ac()
        // console.log('[__askColor]',sult)
        try{
            const data = await fetchJSON('a/game/askColor','POST',{sult})
            console.log('[__askColor]',data)
        }catch(E){
            console.error('askColor 실패, w',E)
            this.askColor()
        }
        

    }

    /**
     * 차례가 변경될때 실행되는 함수
     * @private 
     * @param {{order:number,state:string,lastCard:cardInfo,먹일카드:number,remainCards:number[]}} data 
     */
    async applyTurn(data){
        console.log('[applyTurn]',data,state)
        if(state!='game') return
        //data: {state:"ended"|"playing"|"paused"|"wait",order:number, lastCard:cardInfo|'♠'|'♣'|'♥'|'♦',먹일카드:number}
        // 여기서 #이 접근 불가임;;;
        if(this.order != data.order) this.orderChangeHandler();

        this.order =  data.order;
        this.status = data.state;
        this.lastcard = data.lastCard;
        this.먹일카드 = data.먹일카드;
        this.remainCards = data.remainCards
        console.log('wttime',data,data.waitTime,data.waitTime===null||data.waitTime==Infinity)?Infinity:Number(data.waitTime)
        if(data.waitTime!==undefined) this.waitTime = (data.waitTime===null||data.waitTime==Infinity)?Infinity:Number(data.waitTime)
        if(data.turnChanged) this.lastChangeTurnTime = data.turnChanged
        else throw('문제있어')


        this.updateRanking()
        if(!getElementById('present_card')) this.apply()
        getElementById('present_card').innerHTML = this.printCard(this.lastcard);
        getElementById('order').innerHTML = (this.order);
        getElementById('먹일카드').innerHTML = (this.먹일카드);
        // console.log('present_card/innerHTML',getElementById('present_card').innerHTML)

        const $btn_draw = getElementById('btn_draw')
        const $btn_turnChange = getElementById('btn_turnChange');
        const $myCards_btns = getElementById('myCards').getElementsByTagName('button')
        for(const btn of [$btn_draw, $btn_turnChange, ...$myCards_btns]) btn.disabled = !this.isMyOrder()

        



        const $remainTimeBer = document.getElementById('remainTimeBer')
        if(this.waitTime === undefined) throw('this.waitTime 이상함.')
        console.log('[wttime - timer - out]',this.waitTime)
        if(this.waitTime !== Infinity){
            console.log('[wttime - timer]',this.waitTime)
            $remainTimeBer.style.display = ''

            let a = setInterval(() => {
                const 경과시간  = (new Date() - this.lastChangeTurnTime)/1000
                const 총시간  = this.waitTime
                const p = (총시간-경과시간)/총시간
                if((경과시간>(총시간+1))||this.status == 'ended'){
                    clearInterval(a)
                    return
                }
                // console.log('경과시간, 총시간',경과시간, 총시간, this.waitTime)
                const pro_bar =  $remainTimeBer.querySelector('div.progress-bar')
                // const bar_span = $remainTimeBer.querySelector('div.progress-bar>span')
                pro_bar.attributes['aria-valuemax'].value = this.waitTime
                pro_bar.attributes['aria-valuenow'].value = 총시간-경과시간
                pro_bar.style.width = parseInt(p*100)+'%'
                // bar_span.innerHTML = parseInt(경과시간/총시간*100)+'%'

                // console.log('1111111',[...pro_bar.classList].filter(v=>v.startsWith('bg-')), pro_bar.classList)
                pro_bar.classList.remove([...pro_bar.classList].filter(v=>v.startsWith('bg-'))[0])
                // console.log('2222222, p::',p)
                if(p<0.5) pro_bar.classList.add((p>0.2?'bg-warning':'bg-danger'))

            }, 400);
            


        }else{
            $remainTimeBer.style.display = 'none'
        }

        

    }

    /**
     * innerHTML에 이벤트 추가를 돕는 함수
     * @param {string} id - 이벤트 ID
     */
    async gameEvent(id){
        const data = this.eventlist[id]
        console.log('gameEvent',data)
        throw('잘못된 모드, mode:'+data.mode)
    }

    async wrapDropCard(card){
        if(this.isMyOrder() === false) throw('차례가 아님')
        try{
            await this.dropCard(card)
        }catch(e){
            alert('해당 카드를 낼 수 없습니다.')
            throw('해당X'+e)
        }
        
        // 내 카드 목록에서 해당 카드 제거
        const cards = this.cardList.filter(c=>(c.figure==card.figure)&&(c.sult==card.sult)&&(c.type==card.type))
        console.log('cards',cards,this.cardList,card)
        if(cards.length != 1) throw('id 음수 없음6')
        this.cardList.splice(this.cardList.indexOf(cards[0]),1)
        this.remainCards[this.order] = this.cardList.length // 님은 카드 장수 업데이트
        this.applyCardList()
        this.updateRanking()
    }


    

    /**
     * 이벤트를 이벤트 목록에 추가한다
     * @private
     * @param {any} obj 
     * @returns {number}
     */
    addEventList(obj){
        // const id = this.eventlist.length
        this.eventlist.push(obj)
        //클라이언트기 때문에 계속 쌓여도 문제 없을듯!
        return this.eventlist.length-1
    }

    /**
     * 해당되는 카드를 낸다
     * @private 
     * @param {{figure:'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|null, sult:'♠'|'♣'|'♥'|'♦'|null,type:'General'| 'BlackJoker'| 'ColoredJoker'}} card 
     */
    async dropCard(card){
        // this.#io.emit('onecard.dropCard',card)
        try{
            await fetchJSON('a/game/drop','POST',{card})
            this.thisOrderPlayerDroped = true
        }catch(e){
            // alert('카드를 내는 중 오류가 발생했습니다, error:'+e)
            throw('카드 낼 수 없음')
        }
    }

     /**
     * 자기 차례일 때 카드를 드로우한다.
     * @private 
     * 
     */
    async drawCard(){
        try{
            const newCard = await fetchJSON('./a/game/draw','GET',{});
            console.log('[drawCard]',newCard,this.cardList,JSON.stringify(this.cardList), )
            if(newCard===null) {alert('더 이상 뽑을 수 있는 남아있는 카드가 없습니다.'); return}
            if(this.cardList.some(c=>(c.figure==newCard.figure)&&(c.sult==newCard.sult)&&(c.type==newCard.type))){
                console.error('[drawCard] 중복된 카드 추가',this.cardList,newCard)
                return
            }
             this.cardList.push(newCard)
             this.applyCardList()
             //카드 개수 변경 확인
            //  console.log('111111111',this.remainCards,this.order)
            //  this.remainCards[this.myOrder] = this.cardList.length // 카드 바뀜
            // 어차피 changeTurn에서 바뀜

            //  console.log('22222',this.remainCards,this.order)
             this.updateRanking()
        

        }catch(e){
            alert('카드를 뽑는 중 오류가 발생했습니다. 에러:'+e) 
        }
        
        // this.#applyTurn() 이미 소켓통신으로 응답이 옴
    }

    /**
     * 현재 턴을 넘어가도록 요청한다
     * @private 
     * 
     */
    async turnCahnge(){
        //턴일 넘길 수 없는 경우면 오류 출력
        if(this.isMyOrder()===false) {alert('자신의 차례가 아닙니다'); throw('차례X')}
        try{
            await fetchJSON('a/game/turnChange','POST',{})
            this.orderChangeHandler()
        }catch(e){
            alert('현재 턴을 바꿀 수 없습니다. 오류:'+e)
        }
    }

    /**
     * 저장된 cardlist를 출력한다.
     * @private 
     */
    applyCardList(){
        const $myCards = getElementById('myCards')
        const list = []
        
        $myCards.innerHTML = this.cardList.map(card=>{
            return `<div card-data='${JSON.stringify(card)}' >`
                +`<button class="btn btn-light btn-sm" ${this.isMyOrder()?'':'disabled'}>${this.printCard(card)}</button>`
                +`</div>`
        }).join('')


        //그리기

        const it = this.interactive
        // const $myCards = document.getElementById('myCards')
        it.divs = [...$myCards.childNodes];
        // const btns = [...$myCards.querySelectorAll('button')];
        it.btn_size = [it.divs[0].offsetWidth, it.divs[0].offsetHeight];

        const $scrollmain = document.getElementById('scrollmain')

        it.divs.forEach(ele => {
            const $btn1 = ele;
            (() => {
                const startfn = e => {
                    console.log(e, $btn1, e.layerX, e.layerY, $btn1.offsetLeft, $btn1.offsetTop)
                    it.tackedEle = $btn1
                    it.clkofst = [e.pageX - $btn1.offsetLeft, e.layerY - $btn1.offsetTop + 80]
                    console.log('[pos]',it.clkofst,e.pageX, $btn1.offsetLeft, e.layerY, $btn1.offsetTop, $btn1)
                }

                $btn1.addEventListener('mousedown', startfn)
                $btn1.addEventListener('touchstart', (e)=>{
                    $scrollmain.style.overflowY = 'hidden'
                    startfn(e)
                })
            })();
        });
    }

    /**
     * 카드 객체를 출력한다
     * @param {{figure:'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|null, sult:'♠'|'♣'|'♥'|'♦'|null,type:'General'| 'BlackJoker'| 'ColoredJoker'}} card 
     */
    printCard(card){
        // console.log('[printCard]',card)
        if(typeof card === 'string') {
            const txt_color =  ['black','red'][Number(['♥','♦'].includes(String(card)))]
            return `<span style="color:${txt_color};font-size: 40px;">${card}</span>`
        }
        else return card2SVG(card.type, card.figure, card.sult) 
        //(card.type == 'General' ? `<span class='playingcard'>${card.figure} ${card.sult}</span>` : `<span class ='playingcard'>${card.type}</span>`)
    }

    /**
     * 카드가 업데이트되었을때 실행된다.
     * @private
     */
    applyCard(cardList){
        console.log('[applyCard]',cardList, this.cardList)
        // cardList.map(card=>{
        //     if(!this.cardList.some(c=>((c.type==card.type)&&(c.sult==card.sult)&&(c.figure==card.figure)))) this.cardList.push(card)
        // })
        this.cardList = cardList
        //없는 카드만 추가함.
        this.applyCardList()
    }

    /**
     * 내 차례인지 학인한다.
     * @private
     * @returns {boolean}
     */
    isMyOrder(){
        // console.log('[isMyOrder]',this.order === this.myOrder,'order',this.order,'myorder',this.myOrder,)
        return this.order === this.myOrder
    }

    /**
     * 턴이 바뀌었을 경우 실행되는 함수
     * @private
     */
    orderChangeHandler(){
        this.먹일카드 = 0
        this.thisOrderPlayerDroped = false

        this.lastChangeTurnTime = new Date()
        
    }
    

    async updateRanking(){
        const ranking = this.ranking
        if(state!='game') return false


        // 본인의 파산 여부 확인
        if(this.cardList[this.myOrder] == 0 && this.isbankrupt === false) this.bankrupt()



        console.log('[updateRanking]',ranking, this.remainCards)
        // const ranking = await fetchJSON('a/game/ranking',{})
        getElementById('ranking').innerHTML = 
        `<table class="table table-hover"><thead><tr><th>순서</th><th>이름</th><th>순위</th><th>남은카드</th></tr></thead><tbody>`
        +s_Roomsetting.participantsName.map((nickname,i)=>{
            const p_list =  ranking.filter(v=>v.player.nickname == nickname)
            if(p_list.length!=1) {console.error('[updateRanking] 길이 안맞어',ranking, nickname); throw('길이 안맞어')}
            // console.log('p_list',p_list[0]);
            const {player, rank} = p_list[0];

        const style = (i==this.order)?'font-weight: bold; background-color: gainsboro;':''
        return  `<tr style="${style}">
            <td><b>${i}</b></td>
            <td class='nickname'>${isMe(player.nickname,player.isOnlie)}</td>
            <td>${pX(rank===null?'-':rank)}</td>
            <td>${this.remainCards[i]}장</td>
        </tr>`
    }).join('\n')+'</tbody></table>'

        
    }

    bankrupt(){
        if(this.isbankrupt) throw('이미 파산함')
        this.status = 'bankrupt'
        this.isbankrupt = true
        this.cardList = []
        this.applyCardList()
        alert('파산함')
    }

  }








  //////////////////////////////////////////////////////////////////////////////////////////
  
// const socket = io('/s/socket.io/server');
/**
 * The built-in class for sending HTTP requests.
 * @external io
 */
const socket = io();
// set_io(socket)

socket.on('login',(socket)=>{
    console.log(socket)
})

socket.on('roomlistRefresh', function(roomlist) {
  updateRoomList(roomlist)
});

socket.on('message',(msg)=>{
  console.log('[msg ricv]',msg)
})
socket.on('joinRoom',(roomid)=>{
  console.log('[joinRoom ricv]',roomid)
  if(roomInfoBelong){
    const new_room = roomInfoAll.filter(v=>v.id==roomid)[0]
    if(new_room==undefined) throw("새 방을 만든 경우, 존재하던 방 아님")
    if(!roomInfoBelong.includes(new_room)) roomInfoBelong.push(new_room)
    
    // roomInfoWaiting에서 삭제
    roomInfoWaiting.splice(roomInfoWaiting.indexOf(roomInfoWaiting.filter(v=>v.id==roomid)[0]),1)

    //가입된 경우 자동으로 이 방 세팅으로 이동
    const room = roomInfoBelong.filter(v=>v.id == roomid)[0]
    s_Roomsetting.apply(room, false)

    // updateJoinroomList(roomInfoBelong, roomInfoWaiting)
  }
})
socket.on('changeMember',(data)=>{
  console.log('[changeMember ricv]',data)
  updateMemberInfo(data)
})
socket.on('changeSetting',(data)=>{
  console.log('[changeSetting ricv]',data)
  if(data.roomId == roomInfo.id){

      updateRoomgamesetting(data.setting)
  }
})
socket.on('alert',(data)=>{
  console.log('[alert ricv]',data)
  myConfirm('알림',data.msg, [])
  
})

const s_Roomsetting = new Status_roomsetting()
window.s_Roomsetting = s_Roomsetting
const status_game = new Status_game(socket)
window["status_game"] = status_game
console.log('[state]',state)
apply()
///디버그용
window.status_game = status_game