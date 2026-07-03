import{r as y,a4 as ct,h as jt,a7 as Wt,a8 as qt,j as o,Q as Se,a9 as Ce,aa as je,ab as Ne,F as B,ac as Ie,ad as Ee,ae as Re,B as ot,c as Oe,af as Le,ag as Kt,P as Jt,ah as Qt,ai as $e,aj as Ae,ak as Te,al as Tt,am as ke,an as Pe,ao as Me,ap as _e,s as ft,aq as De,ar as Be,as as Ve,at as ze,au as Ye,av as Nt,aw as Fe,ax as Xe,N as Ue,L as He,ay as Ge,az as We,aA as qe,aB as Ke,aC as Je,aD as Qe,aE as Ze,aF as tr,aG as er,aH as rr,aI as nr,aJ as ar,aK as sr,k as or,aL as ir}from"../index.DF975gRH.js";import{a as cr,L as It,b as fr,d as lr}from"./AnimatedFitHeight-D5UwNLgi.js";import{g as dr,P as ur,D as kt,R as mr,f as pr,c as yr}from"./luxon-B0pRfU-d.js";import{g as hr,u as gr,S as br,r as xr,s as vr}from"./Slider-Bf70uaW-.js";import wr from"./expensive-italy-CVWFu70x.js";import Sr from"./owned-property-CL7Ebs7W.js";import Cr from"./sad-tear-v4-WbaJ3.js";(function(){try{var t=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{};t.SENTRY_RELEASE={id:"beb8b426"};var e=new t.Error().stack;e&&(t._sentryDebugIds=t._sentryDebugIds||{},t._sentryDebugIds[e]="aa21fe15-edb2-41ec-9d89-38da58a53ea2",t._sentryDebugIdIdentifier="sentry-dbid-aa21fe15-edb2-41ec-9d89-38da58a53ea2")}catch{}})();function jr(){const[t,e]=y.useState(void 0);return y.useEffect(()=>{function r(){return typeof document<"u"?document.documentElement.clientHeight:void 0}function n(){e(r())}return n(),window.addEventListener("resize",n),()=>window.removeEventListener("resize",n)},[]),t}const Nr="f-OECMum",Ir="Nh9KLIyH",Er="Wcde9SSR",Rr="_4OA9nsIH",Or="_3L8AzBAV",H={container:Nr,nameContainer:Ir,input:Er,randomBtn:Rr,userProfile:Or};function Lr({onNameUpdated:t}){const{name:e}=y.useContext(ct),r=jt(),[n,a]=y.useState(e||Wt(qt,""));function s(i){a(i),t(i)}return y.useEffect(()=>{r.data?.name&&(n||s(r.data.name))},[r]),o.jsx("div",{className:H.container,children:o.jsx(Se,{query:r,loadingComponent:o.jsx(Re,{}),children:i=>i?o.jsx(Ce,{user:i,nameHint:"Playing as",className:H.userProfile}):o.jsxs("div",{className:H.nameContainer,children:[o.jsx(je,{value:n,onChange:c=>s(c.target.value),placeholder:"Your nickname...",className:H.input,maxLength:Ne}),o.jsx("div",{className:H.randomBtn,onClick:()=>s(Ee()),children:o.jsx(B,{icon:Ie})})]})})})}const $r="AIJWZ5ob",Ar="TOibs0C6",Tr="sbUwjYqM",kr="xsw9wPme",Pr="MOpcbFmz",Mr="o6-VG5fr",_r={gameLogo:$r,logo:Ar,buttons:Tr,btn:kr,aBtn:Pr,discord:Mr};function Dr({className:t,children:e,...r}){return o.jsx(ot,{className:Oe(_r.btn,t),...r,children:e})}const Br="jRRQ5s7R",Vr={popover:Br};function zr({className:t}){const[e,r]=Xr(),n=Fr(e),{dragGuardRef:a,onTooltipHideAttempt:s}=Ur(),i=()=>{r(c=>c===0?100:0)};return o.jsx(Le,{content:o.jsx(Yr,{volume:e,setVolume:r,dragGuardRef:a}),theme:"richup-blended",interactive:!0,onHide:s,hideOnClick:!1,delay:[100,0],children:o.jsx(Dr,{className:t,onClick:i,children:o.jsx(B,{icon:n,size:"lg",fixedWidth:!0})})})}function Yr({volume:t,setVolume:e,dragGuardRef:r}){return o.jsxs("div",{className:Vr.popover,children:[o.jsx(br,{value:t,min:0,max:100,onChange:e,includeDefaultMarks:!1,onBeforeChange:()=>{r.current=!0},onAfterChange:()=>{r.current=!1}}),o.jsxs("span",{children:[t,"%"]})]})}function Fr(t){return t===0?$e:t<=50?Ae:Te}function Xr(){const[t,e]=y.useState(0);return Kt(()=>{e(hr())}),Jt(()=>{t!==null&&gr(t)},[t]),[t,e]}function Ur(){const t=y.useRef(!1),e=y.useRef(void 0);Qt(()=>clearInterval(e.current));function r(n){if(t.current)return clearInterval(e.current),e.current=setInterval(()=>{t.current||(clearInterval(e.current),n.hide())},100),!1}return{dragGuardRef:t,onTooltipHideAttempt:r}}function Hr(t){if(t.sheet)return t.sheet;for(var e=0;e<document.styleSheets.length;e++)if(document.styleSheets[e].ownerNode===t)return document.styleSheets[e]}function Gr(t){var e=document.createElement("style");return e.setAttribute("data-emotion",t.key),t.nonce!==void 0&&e.setAttribute("nonce",t.nonce),e.appendChild(document.createTextNode("")),e.setAttribute("data-s",""),e}var Wr=(function(){function t(r){var n=this;this._insertTag=function(a){var s;n.tags.length===0?n.insertionPoint?s=n.insertionPoint.nextSibling:n.prepend?s=n.container.firstChild:s=n.before:s=n.tags[n.tags.length-1].nextSibling,n.container.insertBefore(a,s),n.tags.push(a)},this.isSpeedy=r.speedy===void 0?!0:r.speedy,this.tags=[],this.ctr=0,this.nonce=r.nonce,this.key=r.key,this.container=r.container,this.prepend=r.prepend,this.insertionPoint=r.insertionPoint,this.before=null}var e=t.prototype;return e.hydrate=function(n){n.forEach(this._insertTag)},e.insert=function(n){this.ctr%(this.isSpeedy?65e3:1)===0&&this._insertTag(Gr(this));var a=this.tags[this.tags.length-1];if(this.isSpeedy){var s=Hr(a);try{s.insertRule(n,s.cssRules.length)}catch{}}else a.appendChild(document.createTextNode(n));this.ctr++},e.flush=function(){this.tags.forEach(function(n){var a;return(a=n.parentNode)==null?void 0:a.removeChild(n)}),this.tags=[],this.ctr=0},t})(),P="-ms-",it="-moz-",S="-webkit-",Zt="comm",Et="rule",Rt="decl",qr="@import",te="@keyframes",Kr="@layer",Jr=Math.abs,lt=String.fromCharCode,Qr=Object.assign;function Zr(t,e){return k(t,0)^45?(((e<<2^k(t,0))<<2^k(t,1))<<2^k(t,2))<<2^k(t,3):0}function ee(t){return t.trim()}function tn(t,e){return(t=e.exec(t))?t[0]:t}function C(t,e,r){return t.replace(e,r)}function bt(t,e){return t.indexOf(e)}function k(t,e){return t.charCodeAt(e)|0}function W(t,e,r){return t.slice(e,r)}function V(t){return t.length}function Ot(t){return t.length}function Z(t,e){return e.push(t),t}function en(t,e){return t.map(e).join("")}var dt=1,X=1,re=0,M=0,L=0,U="";function ut(t,e,r,n,a,s,i){return{value:t,root:e,parent:r,type:n,props:a,children:s,line:dt,column:X,length:i,return:""}}function G(t,e){return Qr(ut("",null,null,"",null,null,0),t,{length:-t.length},e)}function rn(){return L}function nn(){return L=M>0?k(U,--M):0,X--,L===10&&(X=1,dt--),L}function _(){return L=M<re?k(U,M++):0,X++,L===10&&(X=1,dt++),L}function Y(){return k(U,M)}function nt(){return M}function Q(t,e){return W(U,t,e)}function q(t){switch(t){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function ne(t){return dt=X=1,re=V(U=t),M=0,[]}function ae(t){return U="",t}function at(t){return ee(Q(M-1,xt(t===91?t+2:t===40?t+1:t)))}function an(t){for(;(L=Y())&&L<33;)_();return q(t)>2||q(L)>3?"":" "}function sn(t,e){for(;--e&&_()&&!(L<48||L>102||L>57&&L<65||L>70&&L<97););return Q(t,nt()+(e<6&&Y()==32&&_()==32))}function xt(t){for(;_();)switch(L){case t:return M;case 34:case 39:t!==34&&t!==39&&xt(L);break;case 40:t===41&&xt(t);break;case 92:_();break}return M}function on(t,e){for(;_()&&t+L!==57;)if(t+L===84&&Y()===47)break;return"/*"+Q(e,M-1)+"*"+lt(t===47?t:_())}function cn(t){for(;!q(Y());)_();return Q(t,M)}function fn(t){return ae(st("",null,null,null,[""],t=ne(t),0,[0],t))}function st(t,e,r,n,a,s,i,c,d){for(var u=0,m=0,h=i,N=0,w=0,g=0,p=1,E=1,v=1,b=0,x="",A=a,l=s,O=n,I=x;E;)switch(g=b,b=_()){case 40:if(g!=108&&k(I,h-1)==58){bt(I+=C(at(b),"&","&\f"),"&\f")!=-1&&(v=-1);break}case 34:case 39:case 91:I+=at(b);break;case 9:case 10:case 13:case 32:I+=an(g);break;case 92:I+=sn(nt()-1,7);continue;case 47:switch(Y()){case 42:case 47:Z(ln(on(_(),nt()),e,r),d);break;default:I+="/"}break;case 123*p:c[u++]=V(I)*v;case 125*p:case 59:case 0:switch(b){case 0:case 125:E=0;case 59+m:v==-1&&(I=C(I,/\f/g,"")),w>0&&V(I)-h&&Z(w>32?Mt(I+";",n,r,h-1):Mt(C(I," ","")+";",n,r,h-2),d);break;case 59:I+=";";default:if(Z(O=Pt(I,e,r,u,m,a,c,x,A=[],l=[],h),s),b===123)if(m===0)st(I,e,O,O,A,s,h,c,l);else switch(N===99&&k(I,3)===110?100:N){case 100:case 108:case 109:case 115:st(t,O,O,n&&Z(Pt(t,O,O,0,0,a,c,x,a,A=[],h),l),a,l,h,c,n?A:l);break;default:st(I,O,O,O,[""],l,0,c,l)}}u=m=w=0,p=v=1,x=I="",h=i;break;case 58:h=1+V(I),w=g;default:if(p<1){if(b==123)--p;else if(b==125&&p++==0&&nn()==125)continue}switch(I+=lt(b),b*p){case 38:v=m>0?1:(I+="\f",-1);break;case 44:c[u++]=(V(I)-1)*v,v=1;break;case 64:Y()===45&&(I+=at(_())),N=Y(),m=h=V(x=I+=cn(nt())),b++;break;case 45:g===45&&V(I)==2&&(p=0)}}return s}function Pt(t,e,r,n,a,s,i,c,d,u,m){for(var h=a-1,N=a===0?s:[""],w=Ot(N),g=0,p=0,E=0;g<n;++g)for(var v=0,b=W(t,h+1,h=Jr(p=i[g])),x=t;v<w;++v)(x=ee(p>0?N[v]+" "+b:C(b,/&\f/g,N[v])))&&(d[E++]=x);return ut(t,e,r,a===0?Et:c,d,u,m)}function ln(t,e,r){return ut(t,e,r,Zt,lt(rn()),W(t,2,-2),0)}function Mt(t,e,r,n){return ut(t,e,r,Rt,W(t,0,n),W(t,n+1,-1),n)}function F(t,e){for(var r="",n=Ot(t),a=0;a<n;a++)r+=e(t[a],a,t,e)||"";return r}function dn(t,e,r,n){switch(t.type){case Kr:if(t.children.length)break;case qr:case Rt:return t.return=t.return||t.value;case Zt:return"";case te:return t.return=t.value+"{"+F(t.children,n)+"}";case Et:t.value=t.props.join(",")}return V(r=F(t.children,n))?t.return=t.value+"{"+r+"}":""}function un(t){var e=Ot(t);return function(r,n,a,s){for(var i="",c=0;c<e;c++)i+=t[c](r,n,a,s)||"";return i}}function mn(t){return function(e){e.root||(e=e.return)&&t(e)}}function pn(t){var e=Object.create(null);return function(r){return e[r]===void 0&&(e[r]=t(r)),e[r]}}var yn=function(e,r,n){for(var a=0,s=0;a=s,s=Y(),a===38&&s===12&&(r[n]=1),!q(s);)_();return Q(e,M)},hn=function(e,r){var n=-1,a=44;do switch(q(a)){case 0:a===38&&Y()===12&&(r[n]=1),e[n]+=yn(M-1,r,n);break;case 2:e[n]+=at(a);break;case 4:if(a===44){e[++n]=Y()===58?"&\f":"",r[n]=e[n].length;break}default:e[n]+=lt(a)}while(a=_());return e},gn=function(e,r){return ae(hn(ne(e),r))},_t=new WeakMap,bn=function(e){if(!(e.type!=="rule"||!e.parent||e.length<1)){for(var r=e.value,n=e.parent,a=e.column===n.column&&e.line===n.line;n.type!=="rule";)if(n=n.parent,!n)return;if(!(e.props.length===1&&r.charCodeAt(0)!==58&&!_t.get(n))&&!a){_t.set(e,!0);for(var s=[],i=gn(r,s),c=n.props,d=0,u=0;d<i.length;d++)for(var m=0;m<c.length;m++,u++)e.props[u]=s[d]?i[d].replace(/&\f/g,c[m]):c[m]+" "+i[d]}}},xn=function(e){if(e.type==="decl"){var r=e.value;r.charCodeAt(0)===108&&r.charCodeAt(2)===98&&(e.return="",e.value="")}};function se(t,e){switch(Zr(t,e)){case 5103:return S+"print-"+t+t;case 5737:case 4201:case 3177:case 3433:case 1641:case 4457:case 2921:case 5572:case 6356:case 5844:case 3191:case 6645:case 3005:case 6391:case 5879:case 5623:case 6135:case 4599:case 4855:case 4215:case 6389:case 5109:case 5365:case 5621:case 3829:return S+t+t;case 5349:case 4246:case 4810:case 6968:case 2756:return S+t+it+t+P+t+t;case 6828:case 4268:return S+t+P+t+t;case 6165:return S+t+P+"flex-"+t+t;case 5187:return S+t+C(t,/(\w+).+(:[^]+)/,S+"box-$1$2"+P+"flex-$1$2")+t;case 5443:return S+t+P+"flex-item-"+C(t,/flex-|-self/,"")+t;case 4675:return S+t+P+"flex-line-pack"+C(t,/align-content|flex-|-self/,"")+t;case 5548:return S+t+P+C(t,"shrink","negative")+t;case 5292:return S+t+P+C(t,"basis","preferred-size")+t;case 6060:return S+"box-"+C(t,"-grow","")+S+t+P+C(t,"grow","positive")+t;case 4554:return S+C(t,/([^-])(transform)/g,"$1"+S+"$2")+t;case 6187:return C(C(C(t,/(zoom-|grab)/,S+"$1"),/(image-set)/,S+"$1"),t,"")+t;case 5495:case 3959:return C(t,/(image-set\([^]*)/,S+"$1$`$1");case 4968:return C(C(t,/(.+:)(flex-)?(.*)/,S+"box-pack:$3"+P+"flex-pack:$3"),/s.+-b[^;]+/,"justify")+S+t+t;case 4095:case 3583:case 4068:case 2532:return C(t,/(.+)-inline(.+)/,S+"$1$2")+t;case 8116:case 7059:case 5753:case 5535:case 5445:case 5701:case 4933:case 4677:case 5533:case 5789:case 5021:case 4765:if(V(t)-1-e>6)switch(k(t,e+1)){case 109:if(k(t,e+4)!==45)break;case 102:return C(t,/(.+:)(.+)-([^]+)/,"$1"+S+"$2-$3$1"+it+(k(t,e+3)==108?"$3":"$2-$3"))+t;case 115:return~bt(t,"stretch")?se(C(t,"stretch","fill-available"),e)+t:t}break;case 4949:if(k(t,e+1)!==115)break;case 6444:switch(k(t,V(t)-3-(~bt(t,"!important")&&10))){case 107:return C(t,":",":"+S)+t;case 101:return C(t,/(.+:)([^;!]+)(;|!.+)?/,"$1"+S+(k(t,14)===45?"inline-":"")+"box$3$1"+S+"$2$3$1"+P+"$2box$3")+t}break;case 5936:switch(k(t,e+11)){case 114:return S+t+P+C(t,/[svh]\w+-[tblr]{2}/,"tb")+t;case 108:return S+t+P+C(t,/[svh]\w+-[tblr]{2}/,"tb-rl")+t;case 45:return S+t+P+C(t,/[svh]\w+-[tblr]{2}/,"lr")+t}return S+t+P+t+t}return t}var vn=function(e,r,n,a){if(e.length>-1&&!e.return)switch(e.type){case Rt:e.return=se(e.value,e.length);break;case te:return F([G(e,{value:C(e.value,"@","@"+S)})],a);case Et:if(e.length)return en(e.props,function(s){switch(tn(s,/(::plac\w+|:read-\w+)/)){case":read-only":case":read-write":return F([G(e,{props:[C(s,/:(read-\w+)/,":"+it+"$1")]})],a);case"::placeholder":return F([G(e,{props:[C(s,/:(plac\w+)/,":"+S+"input-$1")]}),G(e,{props:[C(s,/:(plac\w+)/,":"+it+"$1")]}),G(e,{props:[C(s,/:(plac\w+)/,P+"input-$1")]})],a)}return""})}},wn=[vn],Sn=function(e){var r=e.key;if(r==="css"){var n=document.querySelectorAll("style[data-emotion]:not([data-s])");Array.prototype.forEach.call(n,function(p){var E=p.getAttribute("data-emotion");E.indexOf(" ")!==-1&&(document.head.appendChild(p),p.setAttribute("data-s",""))})}var a=e.stylisPlugins||wn,s={},i,c=[];i=e.container||document.head,Array.prototype.forEach.call(document.querySelectorAll('style[data-emotion^="'+r+' "]'),function(p){for(var E=p.getAttribute("data-emotion").split(" "),v=1;v<E.length;v++)s[E[v]]=!0;c.push(p)});var d,u=[bn,xn];{var m,h=[dn,mn(function(p){m.insert(p)})],N=un(u.concat(a,h)),w=function(E){return F(fn(E),N)};d=function(E,v,b,x){m=b,w(E?E+"{"+v.styles+"}":v.styles),x&&(g.inserted[v.name]=!0)}}var g={key:r,sheet:new Wr({key:r,container:i,nonce:e.nonce,speedy:e.speedy,prepend:e.prepend,insertionPoint:e.insertionPoint}),nonce:e.nonce,inserted:s,registered:{},insert:d};return g.sheet.hydrate(c),g},pt={exports:{}},j={};var Dt;function Cn(){if(Dt)return j;Dt=1;var t=typeof Symbol=="function"&&Symbol.for,e=t?Symbol.for("react.element"):60103,r=t?Symbol.for("react.portal"):60106,n=t?Symbol.for("react.fragment"):60107,a=t?Symbol.for("react.strict_mode"):60108,s=t?Symbol.for("react.profiler"):60114,i=t?Symbol.for("react.provider"):60109,c=t?Symbol.for("react.context"):60110,d=t?Symbol.for("react.async_mode"):60111,u=t?Symbol.for("react.concurrent_mode"):60111,m=t?Symbol.for("react.forward_ref"):60112,h=t?Symbol.for("react.suspense"):60113,N=t?Symbol.for("react.suspense_list"):60120,w=t?Symbol.for("react.memo"):60115,g=t?Symbol.for("react.lazy"):60116,p=t?Symbol.for("react.block"):60121,E=t?Symbol.for("react.fundamental"):60117,v=t?Symbol.for("react.responder"):60118,b=t?Symbol.for("react.scope"):60119;function x(l){if(typeof l=="object"&&l!==null){var O=l.$$typeof;switch(O){case e:switch(l=l.type,l){case d:case u:case n:case s:case a:case h:return l;default:switch(l=l&&l.$$typeof,l){case c:case m:case g:case w:case i:return l;default:return O}}case r:return O}}}function A(l){return x(l)===u}return j.AsyncMode=d,j.ConcurrentMode=u,j.ContextConsumer=c,j.ContextProvider=i,j.Element=e,j.ForwardRef=m,j.Fragment=n,j.Lazy=g,j.Memo=w,j.Portal=r,j.Profiler=s,j.StrictMode=a,j.Suspense=h,j.isAsyncMode=function(l){return A(l)||x(l)===d},j.isConcurrentMode=A,j.isContextConsumer=function(l){return x(l)===c},j.isContextProvider=function(l){return x(l)===i},j.isElement=function(l){return typeof l=="object"&&l!==null&&l.$$typeof===e},j.isForwardRef=function(l){return x(l)===m},j.isFragment=function(l){return x(l)===n},j.isLazy=function(l){return x(l)===g},j.isMemo=function(l){return x(l)===w},j.isPortal=function(l){return x(l)===r},j.isProfiler=function(l){return x(l)===s},j.isStrictMode=function(l){return x(l)===a},j.isSuspense=function(l){return x(l)===h},j.isValidElementType=function(l){return typeof l=="string"||typeof l=="function"||l===n||l===u||l===s||l===a||l===h||l===N||typeof l=="object"&&l!==null&&(l.$$typeof===g||l.$$typeof===w||l.$$typeof===i||l.$$typeof===c||l.$$typeof===m||l.$$typeof===E||l.$$typeof===v||l.$$typeof===b||l.$$typeof===p)},j.typeOf=x,j}var Bt;function jn(){return Bt||(Bt=1,pt.exports=Cn()),pt.exports}var yt,Vt;function Nn(){if(Vt)return yt;Vt=1;var t=jn(),e={childContextTypes:!0,contextType:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromError:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},r={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},n={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},a={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},s={};s[t.ForwardRef]=n,s[t.Memo]=a;function i(g){return t.isMemo(g)?a:s[g.$$typeof]||e}var c=Object.defineProperty,d=Object.getOwnPropertyNames,u=Object.getOwnPropertySymbols,m=Object.getOwnPropertyDescriptor,h=Object.getPrototypeOf,N=Object.prototype;function w(g,p,E){if(typeof p!="string"){if(N){var v=h(p);v&&v!==N&&w(g,v,E)}var b=d(p);u&&(b=b.concat(u(p)));for(var x=i(g),A=i(p),l=0;l<b.length;++l){var O=b[l];if(!r[O]&&!(E&&E[O])&&!(A&&A[O])&&!(x&&x[O])){var I=m(p,O);try{c(g,O,I)}catch{}}}}return g}return yt=w,yt}Nn();var In=!0;function oe(t,e,r){var n="";return r.split(" ").forEach(function(a){t[a]!==void 0?e.push(t[a]+";"):a&&(n+=a+" ")}),n}var Lt=function(e,r,n){var a=e.key+"-"+r.name;(n===!1||In===!1)&&e.registered[a]===void 0&&(e.registered[a]=r.styles)},ie=function(e,r,n){Lt(e,r,n);var a=e.key+"-"+r.name;if(e.inserted[r.name]===void 0){var s=r;do e.insert(r===s?"."+a:"",s,e.sheet,!0),s=s.next;while(s!==void 0)}};function En(t){for(var e=0,r,n=0,a=t.length;a>=4;++n,a-=4)r=t.charCodeAt(n)&255|(t.charCodeAt(++n)&255)<<8|(t.charCodeAt(++n)&255)<<16|(t.charCodeAt(++n)&255)<<24,r=(r&65535)*1540483477+((r>>>16)*59797<<16),r^=r>>>24,e=(r&65535)*1540483477+((r>>>16)*59797<<16)^(e&65535)*1540483477+((e>>>16)*59797<<16);switch(a){case 3:e^=(t.charCodeAt(n+2)&255)<<16;case 2:e^=(t.charCodeAt(n+1)&255)<<8;case 1:e^=t.charCodeAt(n)&255,e=(e&65535)*1540483477+((e>>>16)*59797<<16)}return e^=e>>>13,e=(e&65535)*1540483477+((e>>>16)*59797<<16),((e^e>>>15)>>>0).toString(36)}var Rn={animationIterationCount:1,aspectRatio:1,borderImageOutset:1,borderImageSlice:1,borderImageWidth:1,boxFlex:1,boxFlexGroup:1,boxOrdinalGroup:1,columnCount:1,columns:1,flex:1,flexGrow:1,flexPositive:1,flexShrink:1,flexNegative:1,flexOrder:1,gridRow:1,gridRowEnd:1,gridRowSpan:1,gridRowStart:1,gridColumn:1,gridColumnEnd:1,gridColumnSpan:1,gridColumnStart:1,msGridRow:1,msGridRowSpan:1,msGridColumn:1,msGridColumnSpan:1,fontWeight:1,lineHeight:1,opacity:1,order:1,orphans:1,scale:1,tabSize:1,widows:1,zIndex:1,zoom:1,WebkitLineClamp:1,fillOpacity:1,floodOpacity:1,stopOpacity:1,strokeDasharray:1,strokeDashoffset:1,strokeMiterlimit:1,strokeOpacity:1,strokeWidth:1},On=/[A-Z]|^ms/g,Ln=/_EMO_([^_]+?)_([^]*?)_EMO_/g,ce=function(e){return e.charCodeAt(1)===45},zt=function(e){return e!=null&&typeof e!="boolean"},ht=pn(function(t){return ce(t)?t:t.replace(On,"-$&").toLowerCase()}),Yt=function(e,r){switch(e){case"animation":case"animationName":if(typeof r=="string")return r.replace(Ln,function(n,a,s){return z={name:a,styles:s,next:z},a})}return Rn[e]!==1&&!ce(e)&&typeof r=="number"&&r!==0?r+"px":r};function K(t,e,r){if(r==null)return"";var n=r;if(n.__emotion_styles!==void 0)return n;switch(typeof r){case"boolean":return"";case"object":{var a=r;if(a.anim===1)return z={name:a.name,styles:a.styles,next:z},a.name;var s=r;if(s.styles!==void 0){var i=s.next;if(i!==void 0)for(;i!==void 0;)z={name:i.name,styles:i.styles,next:z},i=i.next;var c=s.styles+";";return c}return $n(t,e,r)}case"function":{if(t!==void 0){var d=z,u=r(t);return z=d,K(t,e,u)}break}}var m=r;if(e==null)return m;var h=e[m];return h!==void 0?h:m}function $n(t,e,r){var n="";if(Array.isArray(r))for(var a=0;a<r.length;a++)n+=K(t,e,r[a])+";";else for(var s in r){var i=r[s];if(typeof i!="object"){var c=i;e!=null&&e[c]!==void 0?n+=s+"{"+e[c]+"}":zt(c)&&(n+=ht(s)+":"+Yt(s,c)+";")}else if(Array.isArray(i)&&typeof i[0]=="string"&&(e==null||e[i[0]]===void 0))for(var d=0;d<i.length;d++)zt(i[d])&&(n+=ht(s)+":"+Yt(s,i[d])+";");else{var u=K(t,e,i);switch(s){case"animation":case"animationName":{n+=ht(s)+":"+u+";";break}default:n+=s+"{"+u+"}"}}}return n}var Ft=/label:\s*([^\s;{]+)\s*(;|$)/g,z;function $t(t,e,r){if(t.length===1&&typeof t[0]=="object"&&t[0]!==null&&t[0].styles!==void 0)return t[0];var n=!0,a="";z=void 0;var s=t[0];if(s==null||s.raw===void 0)n=!1,a+=K(r,e,s);else{var i=s;a+=i[0]}for(var c=1;c<t.length;c++)if(a+=K(r,e,t[c]),n){var d=s;a+=d[c]}Ft.lastIndex=0;for(var u="",m;(m=Ft.exec(a))!==null;)u+="-"+m[1];var h=En(a)+u;return{name:h,styles:a,next:z}}var An=function(e){return e()},Tn=Tt.useInsertionEffect?Tt.useInsertionEffect:!1,fe=Tn||An,le=y.createContext(typeof HTMLElement<"u"?Sn({key:"css"}):null);le.Provider;var de=function(e){return y.forwardRef(function(r,n){var a=y.useContext(le);return e(r,a,n)})},ue=y.createContext({}),mt={}.hasOwnProperty,vt="__EMOTION_TYPE_PLEASE_DO_NOT_USE__",me=function(e,r){var n={};for(var a in r)mt.call(r,a)&&(n[a]=r[a]);return n[vt]=e,n},kn=function(e){var r=e.cache,n=e.serialized,a=e.isStringTag;return Lt(r,n,a),fe(function(){return ie(r,n,a)}),null},Pn=de(function(t,e,r){var n=t.css;typeof n=="string"&&e.registered[n]!==void 0&&(n=e.registered[n]);var a=t[vt],s=[n],i="";typeof t.className=="string"?i=oe(e.registered,s,t.className):t.className!=null&&(i=t.className+" ");var c=$t(s,void 0,y.useContext(ue));i+=e.key+"-"+c.name;var d={};for(var u in t)mt.call(t,u)&&u!=="css"&&u!==vt&&(d[u]=t[u]);return d.className=i,r&&(d.ref=r),y.createElement(y.Fragment,null,y.createElement(kn,{cache:e,serialized:c,isStringTag:typeof a=="string"}),y.createElement(a,d))}),pe=Pn,Mn=o.Fragment,$=function(e,r,n){return mt.call(r,"css")?o.jsx(pe,me(e,r),n):o.jsx(e,r,n)},Xt=function(e,r){var n=arguments;if(r==null||!mt.call(r,"css"))return y.createElement.apply(void 0,n);var a=n.length,s=new Array(a);s[0]=pe,s[1]=me(e,r);for(var i=2;i<a;i++)s[i]=n[i];return y.createElement.apply(null,s)};(function(t){var e;e||(e=t.JSX||(t.JSX={}))})(Xt||(Xt={}));function ye(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];return $t(e)}function f(){var t=ye.apply(void 0,arguments),e="animation-"+t.name;return{name:e,styles:"@keyframes "+e+"{"+t.styles+"}",anim:1,toString:function(){return"_EMO_"+this.name+"_"+this.styles+"_EMO_"}}}var _n=function t(e){for(var r=e.length,n=0,a="";n<r;n++){var s=e[n];if(s!=null){var i=void 0;switch(typeof s){case"boolean":break;case"object":{if(Array.isArray(s))i=t(s);else{i="";for(var c in s)s[c]&&c&&(i&&(i+=" "),i+=c)}break}default:i=s}i&&(a&&(a+=" "),a+=i)}}return a};function Dn(t,e,r){var n=[],a=oe(t,n,r);return n.length<2?r:a+e(n)}var Bn=function(e){var r=e.cache,n=e.serializedArr;return fe(function(){for(var a=0;a<n.length;a++)ie(r,n[a],!1)}),null},gt=de(function(t,e){var r=[],n=function(){for(var d=arguments.length,u=new Array(d),m=0;m<d;m++)u[m]=arguments[m];var h=$t(u,e.registered);return r.push(h),Lt(e,h,!1),e.key+"-"+h.name},a=function(){for(var d=arguments.length,u=new Array(d),m=0;m<d;m++)u[m]=arguments[m];return Dn(e.registered,n,_n(u))},s={css:n,cx:a,theme:y.useContext(ue)},i=t.children(s);return y.createElement(y.Fragment,null,y.createElement(Bn,{cache:e,serializedArr:r}),i)}),Vn=Object.defineProperty,zn=(t,e,r)=>e in t?Vn(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r,tt=(t,e,r)=>zn(t,typeof e!="symbol"?e+"":e,r),wt=new Map,et=new WeakMap,Ut=0,Yn=void 0;function Fn(t){return t?(et.has(t)||(Ut+=1,et.set(t,Ut.toString())),et.get(t)):"0"}function Xn(t){return Object.keys(t).sort().filter(e=>t[e]!==void 0).map(e=>`${e}_${e==="root"?Fn(t.root):t[e]}`).toString()}function Un(t){const e=Xn(t);let r=wt.get(e);if(!r){const n=new Map;let a;const s=new IntersectionObserver(i=>{i.forEach(c=>{var d;const u=c.isIntersecting&&a.some(m=>c.intersectionRatio>=m);t.trackVisibility&&typeof c.isVisible>"u"&&(c.isVisible=u),(d=n.get(c.target))==null||d.forEach(m=>{m(u,c)})})},t);a=s.thresholds||(Array.isArray(t.threshold)?t.threshold:[t.threshold||0]),r={id:e,observer:s,elements:n},wt.set(e,r)}return r}function he(t,e,r={},n=Yn){if(typeof window.IntersectionObserver>"u"&&n!==void 0){const d=t.getBoundingClientRect();return e(n,{isIntersecting:n,target:t,intersectionRatio:typeof r.threshold=="number"?r.threshold:0,time:0,boundingClientRect:d,intersectionRect:d,rootBounds:d}),()=>{}}const{id:a,observer:s,elements:i}=Un(r),c=i.get(t)||[];return i.has(t)||i.set(t,c),c.push(e),s.observe(t),function(){c.splice(c.indexOf(e),1),c.length===0&&(i.delete(t),s.unobserve(t)),i.size===0&&(s.disconnect(),wt.delete(a))}}function Hn(t){return typeof t.children!="function"}var Ht=class extends y.Component{constructor(t){super(t),tt(this,"node",null),tt(this,"_unobserveCb",null),tt(this,"handleNode",e=>{this.node&&(this.unobserve(),!e&&!this.props.triggerOnce&&!this.props.skip&&this.setState({inView:!!this.props.initialInView,entry:void 0})),this.node=e||null,this.observeNode()}),tt(this,"handleChange",(e,r)=>{e&&this.props.triggerOnce&&this.unobserve(),Hn(this.props)||this.setState({inView:e,entry:r}),this.props.onChange&&this.props.onChange(e,r)}),this.state={inView:!!t.initialInView,entry:void 0}}componentDidMount(){this.unobserve(),this.observeNode()}componentDidUpdate(t){(t.rootMargin!==this.props.rootMargin||t.root!==this.props.root||t.threshold!==this.props.threshold||t.skip!==this.props.skip||t.trackVisibility!==this.props.trackVisibility||t.delay!==this.props.delay)&&(this.unobserve(),this.observeNode())}componentWillUnmount(){this.unobserve()}observeNode(){if(!this.node||this.props.skip)return;const{threshold:t,root:e,rootMargin:r,trackVisibility:n,delay:a,fallbackInView:s}=this.props;this._unobserveCb=he(this.node,this.handleChange,{threshold:t,root:e,rootMargin:r,trackVisibility:n,delay:a},s)}unobserve(){this._unobserveCb&&(this._unobserveCb(),this._unobserveCb=null)}render(){const{children:t}=this.props;if(typeof t=="function"){const{inView:w,entry:g}=this.state;return t({inView:w,entry:g,ref:this.handleNode})}const{as:e,triggerOnce:r,threshold:n,root:a,rootMargin:s,onChange:i,skip:c,trackVisibility:d,delay:u,initialInView:m,fallbackInView:h,...N}=this.props;return y.createElement(e||"div",{ref:this.handleNode,...N},t)}};function ge({threshold:t,delay:e,trackVisibility:r,rootMargin:n,root:a,triggerOnce:s,skip:i,initialInView:c,fallbackInView:d,onChange:u}={}){var m;const[h,N]=y.useState(null),w=y.useRef(u),[g,p]=y.useState({inView:!!c,entry:void 0});w.current=u,y.useEffect(()=>{if(i||!h)return;let x;return x=he(h,(A,l)=>{p({inView:A,entry:l}),w.current&&w.current(A,l),l.isIntersecting&&s&&x&&(x(),x=void 0)},{root:a,rootMargin:n,threshold:t,trackVisibility:r,delay:e},d),()=>{x&&x()}},[Array.isArray(t)?t.toString():t,h,a,n,s,i,r,d,e]);const E=(m=g.entry)==null?void 0:m.target,v=y.useRef(void 0);!h&&E&&!s&&!i&&v.current!==E&&(v.current=E,p({inView:!!c,entry:void 0}));const b=[N,g.inView,g.entry];return b.ref=b[0],b.inView=b[1],b.entry=b[2],b}f`
  from,
  20%,
  53%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }

  40%,
  43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -30px, 0) scaleY(1.1);
  }

  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -15px, 0) scaleY(1.05);
  }

  80% {
    transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0) scaleY(0.95);
  }

  90% {
    transform: translate3d(0, -4px, 0) scaleY(1.02);
  }
`;f`
  from,
  50%,
  to {
    opacity: 1;
  }

  25%,
  75% {
    opacity: 0;
  }
`;f`
  0% {
    transform: translateX(0);
  }

  6.5% {
    transform: translateX(-6px) rotateY(-9deg);
  }

  18.5% {
    transform: translateX(5px) rotateY(7deg);
  }

  31.5% {
    transform: translateX(-3px) rotateY(-5deg);
  }

  43.5% {
    transform: translateX(2px) rotateY(3deg);
  }

  50% {
    transform: translateX(0);
  }
`;f`
  0% {
    transform: scale(1);
  }

  14% {
    transform: scale(1.3);
  }

  28% {
    transform: scale(1);
  }

  42% {
    transform: scale(1.3);
  }

  70% {
    transform: scale(1);
  }
`;f`
  from,
  11.1%,
  to {
    transform: translate3d(0, 0, 0);
  }

  22.2% {
    transform: skewX(-12.5deg) skewY(-12.5deg);
  }

  33.3% {
    transform: skewX(6.25deg) skewY(6.25deg);
  }

  44.4% {
    transform: skewX(-3.125deg) skewY(-3.125deg);
  }

  55.5% {
    transform: skewX(1.5625deg) skewY(1.5625deg);
  }

  66.6% {
    transform: skewX(-0.78125deg) skewY(-0.78125deg);
  }

  77.7% {
    transform: skewX(0.390625deg) skewY(0.390625deg);
  }

  88.8% {
    transform: skewX(-0.1953125deg) skewY(-0.1953125deg);
  }
`;f`
  from {
    transform: scale3d(1, 1, 1);
  }

  50% {
    transform: scale3d(1.05, 1.05, 1.05);
  }

  to {
    transform: scale3d(1, 1, 1);
  }
`;f`
  from {
    transform: scale3d(1, 1, 1);
  }

  30% {
    transform: scale3d(1.25, 0.75, 1);
  }

  40% {
    transform: scale3d(0.75, 1.25, 1);
  }

  50% {
    transform: scale3d(1.15, 0.85, 1);
  }

  65% {
    transform: scale3d(0.95, 1.05, 1);
  }

  75% {
    transform: scale3d(1.05, 0.95, 1);
  }

  to {
    transform: scale3d(1, 1, 1);
  }
`;f`
  from,
  to {
    transform: translate3d(0, 0, 0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translate3d(-10px, 0, 0);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translate3d(10px, 0, 0);
  }
`;f`
  from,
  to {
    transform: translate3d(0, 0, 0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translate3d(-10px, 0, 0);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translate3d(10px, 0, 0);
  }
`;f`
  from,
  to {
    transform: translate3d(0, 0, 0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translate3d(0, -10px, 0);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translate3d(0, 10px, 0);
  }
`;f`
  20% {
    transform: rotate3d(0, 0, 1, 15deg);
  }

  40% {
    transform: rotate3d(0, 0, 1, -10deg);
  }

  60% {
    transform: rotate3d(0, 0, 1, 5deg);
  }

  80% {
    transform: rotate3d(0, 0, 1, -5deg);
  }

  to {
    transform: rotate3d(0, 0, 1, 0deg);
  }
`;f`
  from {
    transform: scale3d(1, 1, 1);
  }

  10%,
  20% {
    transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
  }

  30%,
  50%,
  70%,
  90% {
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
  }

  40%,
  60%,
  80% {
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
  }

  to {
    transform: scale3d(1, 1, 1);
  }
`;f`
  from {
    transform: translate3d(0, 0, 0);
  }

  15% {
    transform: translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg);
  }

  30% {
    transform: translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg);
  }

  45% {
    transform: translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg);
  }

  60% {
    transform: translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg);
  }

  75% {
    transform: translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;const Gn=f`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`,Wn=f`
  from {
    opacity: 0;
    transform: translate3d(-100%, 100%, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,qn=f`
  from {
    opacity: 0;
    transform: translate3d(100%, 100%, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,Kn=f`
  from {
    opacity: 0;
    transform: translate3d(0, -100%, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,Jn=f`
  from {
    opacity: 0;
    transform: translate3d(0, -2000px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,At=f`
  from {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,Qn=f`
  from {
    opacity: 0;
    transform: translate3d(-2000px, 0, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,Zn=f`
  from {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,ta=f`
  from {
    opacity: 0;
    transform: translate3d(2000px, 0, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,ea=f`
  from {
    opacity: 0;
    transform: translate3d(-100%, -100%, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,ra=f`
  from {
    opacity: 0;
    transform: translate3d(100%, -100%, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,na=f`
  from {
    opacity: 0;
    transform: translate3d(0, 100%, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`,aa=f`
  from {
    opacity: 0;
    transform: translate3d(0, 2000px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`;function sa({duration:t=1e3,delay:e=0,timingFunction:r="ease",keyframes:n=At,iterationCount:a=1}){return ye`
    animation-duration: ${t}ms;
    animation-timing-function: ${r};
    animation-delay: ${e}ms;
    animation-name: ${n};
    animation-direction: normal;
    animation-fill-mode: both;
    animation-iteration-count: ${a};

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `}function oa(t){return t==null}function ia(t){return typeof t=="string"||typeof t=="number"||typeof t=="boolean"}function be(t,e){return r=>r?t():e()}function J(t){return be(t,()=>null)}function St(t){return J(()=>({opacity:0}))(t)}const xe=t=>{const{cascade:e=!1,damping:r=.5,delay:n=0,duration:a=1e3,fraction:s=0,keyframes:i=At,triggerOnce:c=!1,className:d,style:u,childClassName:m,childStyle:h,children:N,onVisibilityChange:w}=t,g=y.useMemo(()=>sa({keyframes:i,duration:a}),[a,i]);return oa(N)?null:ia(N)?$(fa,{...t,animationStyles:g,children:String(N)}):xr.isFragment(N)?$(ve,{...t,animationStyles:g}):$(Mn,{children:y.Children.map(N,(p,E)=>{if(!y.isValidElement(p))return null;const v=n+(e?E*a*r:0);switch(p.type){case"ol":case"ul":return $(gt,{children:({cx:b})=>$(p.type,{...p.props,className:b(d,p.props.className),style:Object.assign({},u,p.props.style),children:$(xe,{...t,children:p.props.children})})});case"li":return $(Ht,{threshold:s,triggerOnce:c,onChange:w,children:({inView:b,ref:x})=>$(gt,{children:({cx:A})=>$(p.type,{...p.props,ref:x,className:A(m,p.props.className),css:J(()=>g)(b),style:Object.assign({},h,p.props.style,St(!b),{animationDelay:v+"ms"})})})});default:return $(Ht,{threshold:s,triggerOnce:c,onChange:w,children:({inView:b,ref:x})=>$("div",{ref:x,className:d,css:J(()=>g)(b),style:Object.assign({},u,St(!b),{animationDelay:v+"ms"}),children:$(gt,{children:({cx:A})=>$(p.type,{...p.props,className:A(m,p.props.className),style:Object.assign({},h,p.props.style)})})})})}})})},ca={display:"inline-block",whiteSpace:"pre"},fa=t=>{const{animationStyles:e,cascade:r=!1,damping:n=.5,delay:a=0,duration:s=1e3,fraction:i=0,triggerOnce:c=!1,className:d,style:u,children:m,onVisibilityChange:h}=t,{ref:N,inView:w}=ge({triggerOnce:c,threshold:i,onChange:h});return be(()=>$("div",{ref:N,className:d,style:Object.assign({},u,ca),children:m.split("").map((g,p)=>$("span",{css:J(()=>e)(w),style:{animationDelay:a+p*s*n+"ms"},children:g},p))}),()=>$(ve,{...t,children:m}))(r)},ve=t=>{const{animationStyles:e,fraction:r=0,triggerOnce:n=!1,className:a,style:s,children:i,onVisibilityChange:c}=t,{ref:d,inView:u}=ge({triggerOnce:n,threshold:r,onChange:c});return $("div",{ref:d,className:a,css:J(()=>e)(u),style:Object.assign({},s,St(!u)),children:i})};f`
  from,
  20%,
  40%,
  60%,
  80%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  0% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }

  20% {
    transform: scale3d(1.1, 1.1, 1.1);
  }

  40% {
    transform: scale3d(0.9, 0.9, 0.9);
  }

  60% {
    opacity: 1;
    transform: scale3d(1.03, 1.03, 1.03);
  }

  80% {
    transform: scale3d(0.97, 0.97, 0.97);
  }

  to {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
`;f`
  from,
  60%,
  75%,
  90%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  0% {
    opacity: 0;
    transform: translate3d(0, -3000px, 0) scaleY(3);
  }

  60% {
    opacity: 1;
    transform: translate3d(0, 25px, 0) scaleY(0.9);
  }

  75% {
    transform: translate3d(0, -10px, 0) scaleY(0.95);
  }

  90% {
    transform: translate3d(0, 5px, 0) scaleY(0.985);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;f`
  from,
  60%,
  75%,
  90%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  0% {
    opacity: 0;
    transform: translate3d(-3000px, 0, 0) scaleX(3);
  }

  60% {
    opacity: 1;
    transform: translate3d(25px, 0, 0) scaleX(1);
  }

  75% {
    transform: translate3d(-10px, 0, 0) scaleX(0.98);
  }

  90% {
    transform: translate3d(5px, 0, 0) scaleX(0.995);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;f`
  from,
  60%,
  75%,
  90%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  from {
    opacity: 0;
    transform: translate3d(3000px, 0, 0) scaleX(3);
  }

  60% {
    opacity: 1;
    transform: translate3d(-25px, 0, 0) scaleX(1);
  }

  75% {
    transform: translate3d(10px, 0, 0) scaleX(0.98);
  }

  90% {
    transform: translate3d(-5px, 0, 0) scaleX(0.995);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;f`
  from,
  60%,
  75%,
  90%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  from {
    opacity: 0;
    transform: translate3d(0, 3000px, 0) scaleY(5);
  }

  60% {
    opacity: 1;
    transform: translate3d(0, -20px, 0) scaleY(0.9);
  }

  75% {
    transform: translate3d(0, 10px, 0) scaleY(0.95);
  }

  90% {
    transform: translate3d(0, -5px, 0) scaleY(0.985);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;f`
  20% {
    transform: scale3d(0.9, 0.9, 0.9);
  }

  50%,
  55% {
    opacity: 1;
    transform: scale3d(1.1, 1.1, 1.1);
  }

  to {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
`;f`
  20% {
    transform: translate3d(0, 10px, 0) scaleY(0.985);
  }

  40%,
  45% {
    opacity: 1;
    transform: translate3d(0, -20px, 0) scaleY(0.9);
  }

  to {
    opacity: 0;
    transform: translate3d(0, 2000px, 0) scaleY(3);
  }
`;f`
  20% {
    opacity: 1;
    transform: translate3d(20px, 0, 0) scaleX(0.9);
  }

  to {
    opacity: 0;
    transform: translate3d(-2000px, 0, 0) scaleX(2);
  }
`;f`
  20% {
    opacity: 1;
    transform: translate3d(-20px, 0, 0) scaleX(0.9);
  }

  to {
    opacity: 0;
    transform: translate3d(2000px, 0, 0) scaleX(2);
  }
`;f`
  20% {
    transform: translate3d(0, -10px, 0) scaleY(0.985);
  }

  40%,
  45% {
    opacity: 1;
    transform: translate3d(0, 20px, 0) scaleY(0.9);
  }

  to {
    opacity: 0;
    transform: translate3d(0, -2000px, 0) scaleY(3);
  }
`;const la=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
`,da=f`
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  to {
    opacity: 0;
    transform: translate3d(-100%, 100%, 0);
  }
`,ua=f`
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  to {
    opacity: 0;
    transform: translate3d(100%, 100%, 0);
  }
`,ma=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(0, 100%, 0);
  }
`,pa=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(0, 2000px, 0);
  }
`,ya=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }
`,ha=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(-2000px, 0, 0);
  }
`,ga=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
  }
`,ba=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(2000px, 0, 0);
  }
`,xa=f`
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  to {
    opacity: 0;
    transform: translate3d(-100%, -100%, 0);
  }
`,va=f`
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  to {
    opacity: 0;
    transform: translate3d(100%, -100%, 0);
  }
`,wa=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(0, -100%, 0);
  }
`,Sa=f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(0, -2000px, 0);
  }
`;function Ca(t,e,r){switch(r){case"bottom-left":return e?da:Wn;case"bottom-right":return e?ua:qn;case"down":return t?e?pa:Jn:e?ma:Kn;case"left":return t?e?ha:Qn:e?ya:At;case"right":return t?e?ba:ta:e?ga:Zn;case"top-left":return e?xa:ea;case"top-right":return e?va:ra;case"up":return t?e?Sa:aa:e?wa:na;default:return e?la:Gn}}const ja=t=>{const{big:e=!1,direction:r,reverse:n=!1,...a}=t,s=y.useMemo(()=>Ca(e,n,r),[e,r,n]);return $(xe,{keyframes:s,...a})};f`
  from {
    transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 0) rotate3d(0, 1, 0, -360deg);
    animation-timing-function: ease-out;
  }

  40% {
    transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 150px)
      rotate3d(0, 1, 0, -190deg);
    animation-timing-function: ease-out;
  }

  50% {
    transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 150px)
      rotate3d(0, 1, 0, -170deg);
    animation-timing-function: ease-in;
  }

  80% {
    transform: perspective(400px) scale3d(0.95, 0.95, 0.95) translate3d(0, 0, 0)
      rotate3d(0, 1, 0, 0deg);
    animation-timing-function: ease-in;
  }

  to {
    transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 0) rotate3d(0, 1, 0, 0deg);
    animation-timing-function: ease-in;
  }
`;f`
  from {
    transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
    animation-timing-function: ease-in;
    opacity: 0;
  }

  40% {
    transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
    animation-timing-function: ease-in;
  }

  60% {
    transform: perspective(400px) rotate3d(1, 0, 0, 10deg);
    opacity: 1;
  }

  80% {
    transform: perspective(400px) rotate3d(1, 0, 0, -5deg);
  }

  to {
    transform: perspective(400px);
  }
`;f`
  from {
    transform: perspective(400px) rotate3d(0, 1, 0, 90deg);
    animation-timing-function: ease-in;
    opacity: 0;
  }

  40% {
    transform: perspective(400px) rotate3d(0, 1, 0, -20deg);
    animation-timing-function: ease-in;
  }

  60% {
    transform: perspective(400px) rotate3d(0, 1, 0, 10deg);
    opacity: 1;
  }

  80% {
    transform: perspective(400px) rotate3d(0, 1, 0, -5deg);
  }

  to {
    transform: perspective(400px);
  }
`;f`
  from {
    transform: perspective(400px);
  }

  30% {
    transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
    opacity: 1;
  }

  to {
    transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
    opacity: 0;
  }
`;f`
  from {
    transform: perspective(400px);
  }

  30% {
    transform: perspective(400px) rotate3d(0, 1, 0, -15deg);
    opacity: 1;
  }

  to {
    transform: perspective(400px) rotate3d(0, 1, 0, 90deg);
    opacity: 0;
  }
`;f`
  0% {
    animation-timing-function: ease-in-out;
  }

  20%,
  60% {
    transform: rotate3d(0, 0, 1, 80deg);
    animation-timing-function: ease-in-out;
  }

  40%,
  80% {
    transform: rotate3d(0, 0, 1, 60deg);
    animation-timing-function: ease-in-out;
    opacity: 1;
  }

  to {
    transform: translate3d(0, 700px, 0);
    opacity: 0;
  }
`;f`
  from {
    opacity: 0;
    transform: scale(0.1) rotate(30deg);
    transform-origin: center bottom;
  }

  50% {
    transform: rotate(-10deg);
  }

  70% {
    transform: rotate(3deg);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
`;f`
  from {
    opacity: 0;
    transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`;f`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate3d(100%, 0, 0) rotate3d(0, 0, 1, 120deg);
  }
`;f`
  from {
    transform: rotate3d(0, 0, 1, -200deg);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
`;f`
  from {
    transform: rotate3d(0, 0, 1, -45deg);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
`;f`
  from {
    transform: rotate3d(0, 0, 1, 45deg);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
`;f`
  from {
    transform: rotate3d(0, 0, 1, 45deg);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
`;f`
  from {
    transform: rotate3d(0, 0, 1, -90deg);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
`;f`
  from {
    opacity: 1;
  }

  to {
    transform: rotate3d(0, 0, 1, 200deg);
    opacity: 0;
  }
`;f`
  from {
    opacity: 1;
  }

  to {
    transform: rotate3d(0, 0, 1, 45deg);
    opacity: 0;
  }
`;f`
  from {
    opacity: 1;
  }

  to {
    transform: rotate3d(0, 0, 1, -45deg);
    opacity: 0;
  }
`;f`
  from {
    opacity: 1;
  }

  to {
    transform: rotate3d(0, 0, 1, -45deg);
    opacity: 0;
  }
`;f`
  from {
    opacity: 1;
  }

  to {
    transform: rotate3d(0, 0, 1, 90deg);
    opacity: 0;
  }
`;f`
  from {
    transform: translate3d(0, -100%, 0);
    visibility: visible;
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;f`
  from {
    transform: translate3d(-100%, 0, 0);
    visibility: visible;
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;f`
  from {
    transform: translate3d(100%, 0, 0);
    visibility: visible;
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;f`
  from {
    transform: translate3d(0, 100%, 0);
    visibility: visible;
  }

  to {
    transform: translate3d(0, 0, 0);
  }
`;f`
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    visibility: hidden;
    transform: translate3d(0, 100%, 0);
  }
`;f`
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    visibility: hidden;
    transform: translate3d(-100%, 0, 0);
  }
`;f`
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    visibility: hidden;
    transform: translate3d(100%, 0, 0);
  }
`;f`
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    visibility: hidden;
    transform: translate3d(0, -100%, 0);
  }
`;f`
  from {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }

  50% {
    opacity: 1;
  }
`;f`
  from {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, -1000px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }

  60% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, 60px, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
`;f`
  from {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(-1000px, 0, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }

  60% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(10px, 0, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
`;f`
  from {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(1000px, 0, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }

  60% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(-10px, 0, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
`;f`
  from {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, 1000px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }

  60% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, -60px, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
`;f`
  from {
    opacity: 1;
  }

  50% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }

  to {
    opacity: 0;
  }
`;f`
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, -60px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }

  to {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, 2000px, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
`;f`
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(42px, 0, 0);
  }

  to {
    opacity: 0;
    transform: scale(0.1) translate3d(-2000px, 0, 0);
  }
`;f`
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(-42px, 0, 0);
  }

  to {
    opacity: 0;
    transform: scale(0.1) translate3d(2000px, 0, 0);
  }
`;f`
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, 60px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }

  to {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, -2000px, 0);
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
`;const Na="bPuI4IpU",Ia="dK4HjHa1",Ea="_6TVY6KVX",Ra="ZEtzXAqe",Oa="xrCjPqxq",La="KGAfFxu3",$a="A7vaaFML",Aa="_2WMigrmw",Ta="dQLKG9DB",ka="lb-jt3Gz",Pa="h8jEsQWn",Ma="sD1UdUn0",_a="T5rnlpGr",Da="_4uP-LXi2",T={instructions:Na,content:Ia,sideImage:Ea,summaryLine:Ra,summaryIcon:Oa,text:La,title:$a,subtitle:Aa,divider:Ta,buildings:ka,image:Pa,lastTitle:Ma,expensiveCountry:_a,sadIcon:Da};function Ba({animateIn:t=!1}){const e=we(t);return o.jsxs("div",{className:T.instructions,children:[o.jsxs("div",{className:T.content,children:[o.jsx("h1",{children:"How to play"}),o.jsx(rt,{icon:ke,iconColor:"#81be97",title:"All players start with $1500.",animateIn:t}),o.jsx(rt,{icon:Pe,iconColor:"#ffa1a1",title:"On your turn, roll the dice to move forward.",subtitle:"Got doubles? You’ll have another turn!",animateIn:t}),o.jsx(rt,{icon:Me,iconColor:"#ffdba1",title:"Purchase valuable properties and grow your financial empire.",subtitle:"Once you own a property, other players will pay rent when they land on it.",animateIn:t}),o.jsx(Gt,{}),o.jsxs(Ct,{className:T.buildings,triggerOnce:!0,duration:e,children:[o.jsxs("div",{className:T.text,children:[o.jsxs("div",{className:T.title,children:["Own a full property set?",o.jsx("br",{}),"Start building houses and hotels"]}),o.jsxs("div",{className:T.subtitle,children:["Players will pay you a large amount of money when they land on properties with buildings.",o.jsx("br",{}),"Build hotels to maximize income and make other players lose their money."]})]}),o.jsx("div",{className:T.image,children:o.jsx(Va,{})})]}),o.jsx(Gt,{}),o.jsx(rt,{icon:_e,title:o.jsx("span",{className:T.lastTitle,children:"Be rich. Get richer. Do not bankrupt."}),iconColor:"#d49cff",animateIn:t})]}),o.jsx(Ct,{className:T.sideImage,triggerOnce:!0,duration:e,children:o.jsx("img",{src:Sr,alt:"owned property"})})]})}function rt({icon:t,iconColor:e="",title:r,subtitle:n,animateIn:a=!1}){const s=we(a);return o.jsxs(Ct,{className:T.summaryLine,triggerOnce:!0,duration:s,children:[o.jsx("div",{className:T.summaryIcon,style:{color:e},children:o.jsx(B,{icon:t,fixedWidth:!0})}),o.jsxs("div",{className:T.text,children:[o.jsx("div",{className:T.title,children:r}),o.jsx("div",{className:T.subtitle,children:n})]})]})}function Gt(){return o.jsx("div",{className:T.divider})}function Va(){return o.jsxs("div",{className:T.expensiveCountry,children:[o.jsx("img",{src:wr,alt:"country-with-buildings"}),o.jsx("img",{className:T.sadIcon,src:Cr,alt:"sad-because-expensive"})]})}function we(t){return t?500:0}function Ct({children:t,className:e,duration:r,...n}){return o.jsx(ja,{...n,delay:r&&100,duration:r,children:o.jsx("div",{className:e,children:t})})}function za(t,e){const[r,n]=y.useState(t);t!==r&&(n(t),e(r,t))}function Ya(t){const[e,r]=y.useState(!t),n=ft(),a=y.useRef([]);return za(t,()=>r(!t)),y.useEffect(()=>{const s=a.current;dr(t).then(i=>{if(t&&!i.roomData){De(t),n({to:"/",replace:!0});return}s.push(...i.playingRooms.map(c=>Be(c))),r(!0)})},[t,n]),Qt(()=>{a.current.forEach(s=>Ve.dismiss(s))}),e}const Fa="F0q-YRc4",Xa="sROjnmMA",Ua="_6PzUdqon",Ha="q9MIh4iG",Ga="SJmyf9uz",Wa="_2KDKhIb2",qa="Xx-WiRQ1",Ka="joVkhBop",Ja="wgKNjHrC",Qa="J4AU8Ewq",Za="_9zpci2yF",D={maintenanceMessage:Fa,icon:Xa,tool:Ua,boom:Ha,title:Ga,description:Wa,progressContainer:qa,progress:Ka,discordMsg:Ja,discordIcon:Qa,dismiss:Za};function ts({dismiss:t}){const{maintenanceInfo:e}=y.useContext(ct);return o.jsxs("div",{className:D.maintenanceMessage,children:[o.jsx(rs,{onClick:t}),o.jsxs("div",{className:D.icon,children:[o.jsx(B,{icon:ze,className:D.tool}),o.jsx(B,{icon:Ye,className:D.boom})]}),o.jsx("div",{className:D.title,children:"Richup is getting an update"}),o.jsxs("div",{className:D.description,children:["The servers are currently under maintenance.",o.jsx("br",{}),"Come back in a few minutes."]}),o.jsx(ur,{progressBarClassName:D.progress,containerClassName:D.progressContainer,progress:e.progress}),o.jsx(es,{})]})}function es({className:t}){return o.jsxs(Nt,{className:[D.discordMsg,t],children:["For more updates, join",o.jsxs("a",{href:Xe,target:"_blank",rel:"noreferrer noopener",onClick:Fe,children:[o.jsx(B,{icon:Ue,className:D.discordIcon}),"Richup on Discord"]})]})}function rs({onClick:t}){return o.jsx("div",{className:D.dismiss,onClick:t,children:o.jsx(B,{icon:cr})})}const ns="gPV8ilB3",as={container:ns};function ss({until:t}){return o.jsxs("div",{className:as.container,children:[o.jsx("h3",{children:"You are banned from Richup.io"}),o.jsxs("p",{children:["It means you have violated our"," ",o.jsx(He,{to:"/terms-and-conditions",children:"Terms and conditions"}),"."]}),o.jsxs("small",{children:["Your ban will be lifted on"," ",o.jsx("i",{children:kt.fromJSDate(t).toLocaleString(kt.DATETIME_FULL)})]})]})}function os({isLoadingAds:t=!1,delayMs:e}){const r=Ge();return We(()=>{let n=!1;const a=()=>{r.getState().start(t),n=!0};let s=null;return e!==void 0?s=setTimeout(()=>{a(),n=!0},e):a(),()=>{n&&r.getState().stop(),s!==null&&clearTimeout(s)}},[t,r]),null}const is="aibs05zY",cs="_4YYirDU9",fs="HZ3x2FSX",ls="iJKUZL6n",ds="_3-ISzsVr",us="bBOJ6v7d",ms="E4y4E5lI",ps="c6uYyVyu",ys="VfduHAm9",hs="pvk2axt1",gs="FNnsmX0T",bs="dpiKdp7X",xs="_5inoEREg",vs="CmfPBtNh",ws="cSnjGOu-",Ss="CwoKVxdd",Cs="fUAkLGLm",js="HqbbWVFd",R={lobbyContainer:is,lobby:cs,roomsListShown:fs,logos:ls,logo:ds,subtitle:us,lobbyContents:ms,actions:ps,callToAction:ys,discordButton:hs,public:"AOu--FWI",publicLoaderContents:gs,playMain:bs,shine:xs,private:"sCFZETMJ",roomButton:vs,instructions:ws,muteBtn:Ss,navBar:Cs,largerLoader:js};function Bs({specificRoomId:t}){const{setShowVideoAd:e,maintenanceInfo:r}=y.useContext(ct),n=jt(),a=jr(),s=Ya(t),[i,c]=y.useState(!1);return Kt(()=>t&&e(!0)),s?o.jsxs(Nt,{className:[R.lobbyContainer,i&&R.roomsListShown],children:[o.jsxs("div",{className:R.lobby,style:{minHeight:a},children:[o.jsx(zr,{className:R.muteBtn}),o.jsx(qe,{showLogo:!1,className:R.navBar}),o.jsxs("div",{className:R.lobbyContents,children:[o.jsx(Ns,{}),o.jsx(It,{isLoading:r===null||n.isPending,loader:o.jsx(Ls,{}),children:o.jsx(Is,{specificRoomId:t,isRoomsList:i,setIsRoomsList:c})})]}),o.jsx("div",{className:R.discordButton,children:o.jsx(Ke,{from:"lobbyCorner"})})]}),o.jsx(Je,{}),o.jsx("div",{className:R.instructions,children:o.jsx(Ba,{animateIn:!0})}),o.jsx(Qe,{})]}):o.jsx(os,{delayMs:500})}function Ns(){const t=ft(),n=Ze().pathname==="/"?void 0:()=>t({to:"/"});return o.jsxs("div",{className:R.logos,children:[o.jsx(Es,{}),o.jsx(tr,{className:R.logo,onClick:n}),o.jsx("h2",{className:R.subtitle,children:"Rule the economy"})]})}function Is({specificRoomId:t,isRoomsList:e,setIsRoomsList:r}){const{name:n,maintenanceInfo:a,updateName:s}=y.useContext(ct),[i,c]=y.useState(n||""),[d,u]=y.useState(!1),[m,h]=y.useState(a?.isMaintenance),N=jt();Jt(()=>{h(a?.isMaintenance)},[a?.isMaintenance]);function w(){s(d?i:Wt(qt,""))}return m?o.jsx(ts,{dismiss:()=>h(!1)}):e?o.jsx(mr,{onBack:()=>r(!1),beforeRedirect:w}):N.data?.bannedUntil?o.jsx(ss,{until:N.data.bannedUntil}):o.jsxs(Nt,{className:[R.actions,!1],children:[o.jsxs("div",{className:R.callToAction,children:[o.jsx(Lr,{onNameUpdated:g=>{c(g),u(!0)}}),o.jsx(Rs,{specificRoomId:t,beforeRedirect:w})]}),o.jsx(Os,{beforeRedirect:w,onAllRoomsClick:()=>r(!0)})]})}function Es(){const[t,e]=y.useState(0);function r(){e(n=>n+1),vr.dice.play()}return o.jsx(er,{value:6,rollCount:t,onClick:r})}function Rs({specificRoomId:t=null,beforeRedirect:e}){const[r,n]=y.useState(!1),a=ft(),s=t!==null;async function i(){n(!0);const d=s?t:await pr(lr.maxPlayers);await c(d),n(!1)}async function c(d){e(),await a({to:`/room/${d}`,state:{fromLobby:!0}})}return rr("onContinuePlaying",d=>{c(d)}),o.jsx(It,{isLoading:r,className:R.public,contentClassName:R.publicLoaderContents,children:o.jsxs(ot,{onClick:i,className:R.playMain,icon:o.jsx(B,{icon:nr}),noMargin:!0,children:[s?"Enter Game":"Play",o.jsx("div",{className:R.shine})]})})}function Os({beforeRedirect:t,onAllRoomsClick:e}){const r=ft(),[n,a]=y.useState(!1);function s(c){t(),r({to:`/room/${c}`,state:{fromLobby:!0}})}async function i(){a(!0);try{const c=await yr(!0);s(c.roomId)}catch(c){or(ir(c)),a(!1)}}return o.jsxs(It,{isLoading:n,className:R.private,contentClassName:R.privateContents,children:[o.jsx(ot,{type:"subtle",className:R.roomButton,icon:o.jsx(B,{icon:ar}),onClick:e,children:"All rooms"}),o.jsx(ot,{onClick:i,className:R.roomButton,type:"subtle",icon:o.jsx(B,{icon:sr}),children:"Create a private game"})]})}function Ls(){return o.jsx(B,{icon:fr,spin:!0,className:R.largerLoader})}export{es as D,Ba as G,Bs as L,os as a,Dr as b,_r as c,zr as d,za as u};
