import{readFileSync as r,readdirSync as d,mkdirSync as m,writeFileSync as w}from"node:fs";
let I=process.env.MAKEFUN_INPUT_DIR||"/input",O=process.env.MAKEFUN_OUTPUT_DIR||"/output";
for(let n of d(I)){
let p=r(I+"/"+n+"/program.bin"),q=r(I+"/"+n+"/input.bin"),D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536),s=0,c=0,x=0,j=0,t=0,l=0,e=0;
let P=v=>{if(s>255)throw 3;D[s++]=v|0},N=k=>{if(s<k)throw 2};
try{L:for(;;){
if(t==1e6)throw 10;
if(x<0||x>=p.length)throw 9;
let b=p[x],v=b==1?1:b==2?4:b>47&&b<52?2:0;
if(x+v>=p.length)throw 9;
t++;let y=x+1+v;x=y;let R=()=>((p[y-2]|p[y-1]<<8)<<16>>16);
if(b>15&&b<35&&b-23&&b-27&&b-31){
N(2);
let A=D[s-2],B=D[s-1];
if(b>18&&b<23&&B==0)throw 4;
let f=b==16?A+B|0:b==17?A-B|0:b==18?Math.imul(A,B):b==19?A/B|0:b==20?A%B|0:b==21?(A>>>0)/(B>>>0)|0:b==22?(A>>>0)%(B>>>0)|0:b==24?A&B:b==25?A|B:b==26?A^B:b==28?A<<B:b==29?A>>B:b==30?A>>>B|0:b==32?A==B?1:0:b==33?A<B?1:0:(A>>>0)<(B>>>0)?1:0;
s-=2;D[s++]=f;continue;
}
switch(b){
case 0:e=0;break L;
case 1:P((p[y-1]<<24)>>24);break;
case 2:P(p[y-4]|p[y-3]<<8|p[y-2]<<16|p[y-1]<<24);break;
case 3:N(1);s--;break;
case 4:N(1);P(D[s-1]);break;
case 5:N(2);let a=D[s-1];D[s-1]=D[s-2];D[s-2]=a;break;
case 6:N(2);P(D[s-2]);break;
case 7:N(3);let u=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=u;break;
case 23:case 27:N(1);D[s-1]=b==23?-D[s-1]|0:~D[s-1];break;
case 48:x=y+R();break;
case 49:case 50:N(1);let z=D[--s];if((b==49)==(z==0))x=y+R();break;
case 51:if(c>63)throw 7;C[c++]=y;x=p[y-2]|p[y-1]<<8;break;
case 52:if(!c)throw 8;x=C[--c];break;
case 64:N(1);let h=D[s-1];if(h<0||h>255)throw 6;D[s-1]=M[h];break;
case 65:N(2);let k=D[s-1];if(k<0||k>255)throw 6;M[k]=D[s-2];s-=2;break;
case 80:N(1);let g=String(D[s-1]);if(l+g.length>65536)throw 11;s--;for(let i=0;i<g.length;i++)o[l++]=g.charCodeAt(i);break;
case 81:N(1);if(l>65535)throw 11;o[l++]=D[--s]&255;break;
case 82:P(j<q.length?q[j++]:-1);break;
case 83:N(1);e=D[--s]&255;break L;
default:throw 5;
}
}}catch(z){e=z}
m(O+"/"+n,{recursive:true});w(O+"/"+n+"/stdout.bin",o.slice(0,l));w(O+"/"+n+"/exit.txt",e+"\n");
}
