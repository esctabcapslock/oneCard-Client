// @ts-check
'use strict'

const isSafari = navigator.userAgent.includes('Mac')
const cardWidth = 300
const cardHeight = 500
const txt_xpd = 110
const sultpos = {
  'A':[[0,0,true]],
  '2':[[0,90,true],[0,90,false]],
  '3':[[0,0,true],[0,100,true],[0,100,false]],
  '4':[[50,90,true],[-50,90,true],[50,90,false],[-50,90,false],],
  '5':[[0,0,true],[50,90,true],[-50,90,true],[50,90,false],[-50,90,false],],
  '6':[[50,0,true],[-50,0,true],[50,90,true],[-50,90,true],[50,90,false],[-50,90,false],],
  '7':[[50,-20,true],[-50,-20,true],[50,110,true],[-50,110,true],[50,110,false],[-50,110,false],[0,45,true],],
  '8':[[50,130,true],[-50,130,true],[50,48,true],[-50,48,true],[50,130,false],[-50,130,false],[50,48,false],[-50,48,false],],
  '9':[[50,150,true],[-50,150,true],[50,65,true],[-50,65,true],[50,150,false],[-50,150,false],[50,65,false],[-50,65,false],[0,0,true]],
  '10':[[50,160,true],[-50,160,true],[50,80,true],[-50,80,true],[50,160,false],[-50,160,false],[50,80,false],[-50,80,false],[50,0,true],[-50,0,true]],
}

const sultsize = {
  'A' :180,
  '2' :120,
  '3' :100,
  '4' :100,
  '5' :100,
  '6' :100,
  '7' :100,
  '8' :100,
  '9' :100,
  '10':100,
}

if(isSafari) for(let fig in sultsize){sultsize[fig]*=0.8}

const center = {
  'J':'잭',
  'Q':'퀸',
  'K':'킹',
}


const bdr_width = 2

/**
 * SVG text로 카드를 출력함
 * @param {'General'| 'BlackJoker'| 'ColoredJoker'} type 
 * @param {'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|null} figure 
 * @param {'♠'|'♣'|'♥'|'♦'|null} sult 
 * @param {string[]} eleclass 
 * @returns {string}
 */

export function card2SVG(type, figure, sult, eleclass=[]){
      
      const txt_color = type==='General' ? ['black','red'][Number(['♥','♦'].includes(String(sult)))] : ['black','red'][Number(type=='ColoredJoker')]
      // console.log(txt_color)

      

if(type == 'General')
return  `<svg viewBox="${-cardWidth/2} ${-cardHeight/2} ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg" style="user-select: none; -webkit-user-select: none;"  fill="grey" width="${cardWidth}px" height="${cardHeight}px" class="${eleclass.join(' ')}">

    <rect x="${-cardWidth/2+bdr_width}" y="${-cardHeight/2+bdr_width}" rx="30px" width="${cardWidth-bdr_width*2}" height="${cardHeight-bdr_width*2}" fill="white" stroke="black" stroke-width="${bdr_width*2}px"/>

  <text x="${-txt_xpd}" y="-190" fill="${txt_color}" dominant-baseline="middle" class="figure svgtext" >${figure}</text>
  <text x="${-txt_xpd}" y="-150" fill="${txt_color}" dominant-baseline="middle" class="sult svgtext" >${sult}</text>
  
  <text x="${-txt_xpd}" y="-190" fill="${txt_color}" dominant-baseline="middle" class="figure svgtext overturned" >${figure}</text>
  <text x="${-txt_xpd}" y="-150" fill="${txt_color}" dominant-baseline="middle" class="sult svgtext overturned" >${sult}</text>
  ${
    sultpos[figure] ? sultpos[figure].map(p=>
    `<text x="${p[0]}" y=${-p[1]} fill="${txt_color}" dominant-baseline="central" class="sult svgtext ${p[2]?'':'overturned'}" style="font-size:${sultsize[figure]}px">${sult}</text>`
    ).join('\n') : 
    `<text x="0" y=0 fill="${txt_color}" dominant-baseline="central" class="sult svgtext" style="font-size:200px">${center[figure]}</text>`
  }

  <style>
    .svgtext{
        font: 60px sans-serif;
        text-anchor: middle;
    }

    .sult{
      font-size: 45px;
    }

    
    .overturned{
      transform: rotate(180deg);
      /*rotate: 180deg*/
    }
  </style>

  <svg viewBox="0 0 10 10" x="200" width="100" stroke="none">
  </svg>
</svg>`


 return  `<svg viewBox="${-cardWidth/2} ${-cardHeight/2} ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg" style="user-select: none;"  fill="grey" width="${cardWidth}px" height="${cardHeight}px">

<rect x="${-cardWidth/2+bdr_width}" y="${-cardHeight/2+bdr_width}" rx="30px" width="${cardWidth-bdr_width*2}" height="${cardHeight-bdr_width*2}" fill="white" stroke="black" stroke-width="${bdr_width*2}px"/>

<text x="${-txt_xpd}" y="-190" fill="${txt_color}" dominant-baseline="middle" class="figure svgtext" style="font-size:30px; transform: scale(0.7, 1);">JOKER</text>
<text x="${-txt_xpd}" y="-190" fill="${txt_color}" dominant-baseline="middle" class="figure svgtext overturned" style="font-size:30px; transform: scale(0.7, 1) rotate(180deg);">JOKER</text>


<text x="0" y=-70 fill="${txt_color}" dominant-baseline="central" class="sult svgtext" style="font-size:160px">${'조'}</text>
<text x="0" y= 70 fill="${txt_color}" dominant-baseline="central" class="sult svgtext" style="font-size:160px">${'커'}</text>

<style>
.svgtext{
    font: 60px sans-serif;
    text-anchor: middle;
}
.sult{
  font-size: 45px;
}
.overturned{
  transform: rotate(180deg);
  /*rotate: 180deg*/
}
</style>

<svg viewBox="0 0 10 10" x="200" width="100" stroke="none">
</svg>
</svg>`
}

