/*! JsRender v1.0.5: http://jsviews.com/#jsrender */
/*! **VERSION FOR WEB** (For NODE.JS see http://jsviews.com/download/jsrender-node.js) */

!function(t,e){var n=e.jQuery;"object"==typeof exports?module.exports=n?t(e,n):function(n){if(n&&!n.fn)throw"Provide jQuery or null";return t(e,n)}:"function"==typeof define&&define.amd?define(function(){return t(e)}):t(e,!1)}(function(t,e){"use strict";function n(t,e){return function(){var n,r=this,i=r.base;return r.base=t,n=e.apply(r,arguments),r.base=i,n}}function r(t,e){return st(e)&&(e=n(t?t._d?t:n(a,t):a,e),e._d=(t&&t._d||0)+1),e}function i(t,e){var n,i=e.props;for(n in i)!$t.test(n)||t[n]&&t[n].fix||(t[n]="convert"!==n?r(t.constructor.prototype[n],i[n]):i[n])}function o(t){return t}function a(){return""}function s(t){try{throw console.log("JsRender dbg breakpoint: "+t),"dbg breakpoint"}catch(e){}return this.base?this.baseApply(arguments):t}function l(t){this.name=(e.link?"JsViews":"JsRender")+" Error",this.message=t||this.name}function d(t,e){if(t){for(var n in e)t[n]=e[n];return t}}function p(t,e,n){return t?lt(t)?p.apply(ot,t):(wt=n?n[0]:wt,/^(\W|_){5}$/.test(t+e+wt)||S("Invalid delimiters"),ht=t[0],_t=t[1],xt=e[0],bt=e[1],gt.delimiters=[ht+_t,xt+bt,wt],t="\\"+ht+"(\\"+wt+")?\\"+_t,e="\\"+xt+"\\"+bt,rt="(?:(\\w+(?=[\\/\\s\\"+xt+"]))|(\\w+)?(:)|(>)|(\\*))\\s*((?:[^\\"+xt+"]|\\"+xt+"(?!\\"+bt+"))*?)",ft.rTag="(?:"+rt+")",rt=new RegExp("(?:"+t+rt+"(\\/)?|\\"+ht+"(\\"+wt+")?\\"+_t+"(?:(?:\\/(\\w+))\\s*|!--[\\s\\S]*?--))"+e,"g"),ft.rTmpl=new RegExp("^\\s|\\s$|<.*>|([^\\\\]|^)[{}]|"+t+".*"+e),mt):gt.delimiters}function u(t,e){e||t===!0||(e=t,t=void 0);var n,r,i,o,a=this,s="root"===e;if(t){if(o=e&&a.type===e&&a,!o)if(n=a.views,a._.useKey){for(r in n)if(o=e?n[r].get(t,e):n[r])break}else for(r=0,i=n.length;!o&&r<i;r++)o=e?n[r].get(t,e):n[r]}else if(s)o=a.root;else if(e)for(;a&&!o;)o=a.type===e?a:void 0,a=a.parent;else o=a.parent;return o||void 0}function c(){var t=this.get("item");return t?t.index:void 0}function f(){return this.index}function g(t,e,n,r){var i,o,s,l=0;if(1===n&&(r=1,n=void 0),e)for(o=e.split("."),s=o.length;t&&l<s;l++)i=t,t=o[l]?t[o[l]]:t;return n&&(n.lt=n.lt||l<s),void 0===t?r?a:"":r?function(){return t.apply(i,arguments)}:t}function v(n,r,i){var o,a,s,l,p,u,c,f=this,g=!kt&&arguments.length>1,v=f.ctx;if(n){if(f._||(p=f.index,f=f.tag),u=f,v&&v.hasOwnProperty(n)||(v=ut).hasOwnProperty(n)){if(s=v[n],"tag"===n||"tagCtx"===n||"root"===n||"parentTags"===n)return s}else v=void 0;if((!kt&&f.tagCtx||f.linked)&&(s&&s._cxp||(f=f.tagCtx||st(s)?f:(f=f.scope||f,!f.isTop&&f.ctx.tag||f),void 0!==s&&f.tagCtx&&(f=f.tagCtx.view.scope),v=f._ocps,s=v&&v.hasOwnProperty(n)&&v[n]||s,s&&s._cxp||!i&&!g||((v||(f._ocps=f._ocps||{}))[n]=s=[{_ocp:s,_vw:u,_key:n}],s._cxp={path:Tt,ind:0,updateValue:function(t,n){return e.observable(s[0]).setProperty(Tt,t),this}})),l=s&&s._cxp)){if(arguments.length>2)return a=s[1]?ft._ceo(s[1].deps):[Tt],a.unshift(s[0]),a._cxp=l,a;if(p=l.tagElse,c=s[1]?l.tag&&l.tag.cvtArgs?l.tag.cvtArgs(p,1)[l.ind]:s[1](s[0].data,s[0],ft):s[0]._ocp,g)return s&&c!==r&&ft._ucp(n,r,f,l),f;s=c}return s&&st(s)&&(o=function(){return s.apply(this&&this!==t?this:u,arguments)},d(o,s)),o||s}}function m(t){return t&&(t.fn?t:this.getRsc("templates",t)||dt(t))}function h(t,e,n,r){var o,a,s,l,p,u="number"==typeof n&&e.tmpl.bnds[n-1];if(void 0===r&&u&&u._lr&&(r=""),void 0!==r?n=r={props:{},args:[r]}:u&&(n=u(e.data,e,ft)),u=u._bd&&u,t||u){if(a=e._lc,o=a&&a.tag,n.view=e,!o){if(o=d(new ft._tg,{_:{bnd:u,unlinked:!0,lt:n.lt},inline:!a,tagName:":",convert:t,onArrayChange:!0,flow:!0,tagCtx:n,tagCtxs:[n],_is:"tag"}),l=n.args.length,l>1)for(p=o.bindTo=[];l--;)p.unshift(l);a&&(a.tag=o,o.linkCtx=a),n.ctx=Q(n.ctx,(a?a.view:e).ctx),i(o,n)}o._er=r&&s,o.ctx=n.ctx||o.ctx||{},n.ctx=void 0,s=o.cvtArgs()[0],o._er=r&&s}else s=n.args[0];return s=u&&e._.onRender?e._.onRender(s,e,o):s,void 0!=s?s:""}function _(t,e){var n,r,i,o,a,s,l,d=this;if(d.tagName){if(s=d,d=(s.tagCtxs||[d])[t||0],!d)return}else s=d.tag;if(a=s.bindFrom,o=d.args,(l=s.convert)&&""+l===l&&(l="true"===l?void 0:d.view.getRsc("converters",l)||S("Unknown converter: '"+l+"'")),l&&!e&&(o=o.slice()),a){for(i=[],n=a.length;n--;)r=a[n],i.unshift(x(d,r));e&&(o=i)}if(l){if(l=l.apply(s,i||o),void 0===l)return o;if(a=a||[0],n=a.length,lt(l)&&l.length===n||(l=[l],a=[0],n=1),e)o=l;else for(;n--;)r=a[n],+r===r&&(o[r]=l[n])}return o}function x(t,e){return t=t[+e===e?"args":"props"],t&&t[e]}function b(t){return this.cvtArgs(t,1)}function w(t,e){var n,r,i=this;if(""+e===e){for(;void 0===n&&i;)r=i.tmpl&&i.tmpl[t],n=r&&r[e],i=i.parent;return n||ot[t][e]}}function y(t,e,n,r,o,a){function s(t){var e=l[t];if(void 0!==e)for(e=lt(e)?e:[e],m=e.length;m--;)J=e[m],isNaN(parseInt(J))||(e[m]=parseInt(J));return e||[0]}e=e||it;var l,d,p,u,c,f,g,m,h,w,y,k,C,T,j,A,P,R,N,M,F,V,$,I,D,J,U,q,K,L,B=0,H="",W=e._lc||!1,Z=e.ctx,z=n||e.tmpl,G="number"==typeof r&&e.tmpl.bnds[r-1];for("tag"===t._is?(l=t,t=l.tagName,r=l.tagCtxs,p=l.template):(d=e.getRsc("tags",t)||S("Unknown tag: {{"+t+"}} "),p=d.template),void 0===a&&G&&(G._lr=d.lateRender&&G._lr!==!1||G._lr)&&(a=""),void 0!==a?(H+=a,r=a=[{props:{},args:[],params:{props:{}}}]):G&&(r=G(e.data,e,ft)),g=r.length;B<g;B++)y=r[B],P=y.tmpl,(!W||!W.tag||B&&!W.tag.inline||l._er||P&&+P===P)&&(P&&z.tmpls&&(y.tmpl=y.content=z.tmpls[P-1]),y.index=B,y.ctxPrm=v,y.render=E,y.cvtArgs=_,y.bndArgs=b,y.view=e,y.ctx=Q(Q(y.ctx,d&&d.ctx),Z)),(n=y.props.tmpl)&&(y.tmpl=e._getTmpl(n),y.content=y.content||y.tmpl),l?W&&W.fn._lr&&(R=!!l.init):(l=new d._ctr,R=!!l.init,l.parent=f=Z&&Z.tag,l.tagCtxs=r,W&&(l.inline=!1,W.tag=l),l.linkCtx=W,(l._.bnd=G||W.fn)?(l._.ths=y.params.props["this"],l._.lt=r.lt,l._.arrVws={}):l.dataBoundOnly&&S(t+" must be data-bound:\n{^{"+t+"}}")),I=l.dataMap,y.tag=l,I&&r&&(y.map=r[B].map),l.flow||(k=y.ctx=y.ctx||{},u=l.parents=k.parentTags=Z&&Q(k.parentTags,Z.parentTags)||{},f&&(u[f.tagName]=f),u[l.tagName]=k.tag=l,k.tagCtx=y);if(!(l._er=a)){for(i(l,r[0]),l.rendering={rndr:l.rendering},B=0;B<g;B++){if(y=l.tagCtx=r[B],$=y.props,l.ctx=y.ctx,!B){if(R&&(l.init(y,W,l.ctx),R=void 0),y.args.length||y.argDefault===!1||l.argDefault===!1||(y.args=F=[y.view.data],y.params.args=["#data"]),T=s("bindTo"),void 0!==l.bindTo&&(l.bindTo=T),void 0!==l.bindFrom?l.bindFrom=s("bindFrom"):l.bindTo&&(l.bindFrom=l.bindTo=T),j=l.bindFrom||T,q=T.length,U=j.length,l._.bnd&&(K=l.linkedElement)&&(l.linkedElement=K=lt(K)?K:[K],q!==K.length&&S("linkedElement not same length as bindTo")),(K=l.linkedCtxParam)&&(l.linkedCtxParam=K=lt(K)?K:[K],U!==K.length&&S("linkedCtxParam not same length as bindFrom/bindTo")),j)for(l._.fromIndex={},l._.toIndex={},h=U;h--;)for(J=j[h],m=q;m--;)J===T[m]&&(l._.fromIndex[m]=h,l._.toIndex[h]=m);W&&(W.attr=l.attr=W.attr||l.attr||W._dfAt),c=l.attr,l._.noVws=c&&c!==Kt}if(F=l.cvtArgs(B),l.linkedCtxParam)for(V=l.cvtArgs(B,1),m=U,L=l.constructor.prototype.ctx;m--;)(C=l.linkedCtxParam[m])&&(J=j[m],A=V[m],y.ctx[C]=ft._cp(L&&void 0===A?L[C]:A,void 0!==A&&x(y.params,J),y.view,l._.bnd&&{tag:l,cvt:l.convert,ind:m,tagElse:B}));(N=$.dataMap||I)&&(F.length||$.dataMap)&&(M=y.map,M&&M.src===F[0]&&!o||(M&&M.src&&M.unmap(),N.map(F[0],y,M,!l._.bnd),M=y.map),F=[M.tgt]),w=void 0,l.render&&(w=l.render.apply(l,F),e.linked&&w&&!Et.test(w)&&(n={links:[]},n.render=n.fn=function(){return w},w=O(n,e.data,void 0,!0,e,void 0,void 0,l))),F.length||(F=[e]),void 0===w&&(D=F[0],l.contentCtx&&(D=l.contentCtx===!0?e:l.contentCtx(D)),w=y.render(D,!0)||(o?void 0:"")),H=H?H+(w||""):void 0!==w?""+w:void 0}l.rendering=l.rendering.rndr}return l.tagCtx=r[0],l.ctx=l.tagCtx.ctx,l._.noVws&&l.inline&&(H="text"===c?pt.html(H):""),G&&e._.onRender?e._.onRender(H,e,l):H}function k(t,e,n,r,i,o,a,s){var l,d,p,u=this,f="array"===e;u.content=s,u.views=f?[]:{},u.data=r,u.tmpl=i,p=u._={key:0,useKey:f?0:1,id:""+Jt++,onRender:a,bnds:{}},u.linked=!!a,u.type=e||"top",n&&"top"!==n.type||((u.ctx=t||{}).root=u.data),(u.parent=n)?(u.root=n.root||u,l=n.views,d=n._,u.isTop=d.scp,u.scope=(!t.tag||t.tag===n.ctx.tag)&&!u.isTop&&n.scope||u,d.useKey?(l[p.key="_"+d.useKey++]=u,u.index=Ht,u.getIndex=c):l.length===(p.key=u.index=o)?l.push(u):l.splice(o,0,u),u.ctx=t||n.ctx):e&&(u.root=u)}function C(t){var e,n,r;for(e in Gt)n=e+"s",t[n]&&(r=t[n],t[n]={},ot[n](r,t))}function T(t,e,n){function i(){var e=this;e._={unlinked:!0},e.inline=!0,e.tagName=t}var o,a,s,l=new ft._tg;if(st(e)?e={depends:e.depends,render:e}:""+e===e&&(e={template:e}),a=e.baseTag){e.flow=!!e.flow,a=""+a===a?n&&n.tags[a]||ct[a]:a,a||S('baseTag: "'+e.baseTag+'" not found'),l=d(l,a);for(s in e)l[s]=r(a[s],e[s])}else l=d(l,e);return void 0!==(o=l.template)&&(l.template=""+o===o?dt[o]||dt(o):o),(i.prototype=l).constructor=l._ctr=i,n&&(l._parentTmpl=n),l}function j(t){return this.base.apply(this,t)}function A(t,n,r,i){function o(n){var o,s;if(""+n===n||n.nodeType>0&&(a=n)){if(!a)if(/^\.\/[^\\:*?"<>]*$/.test(n))(s=dt[t=t||n])?n=s:a=document.getElementById(n);else if(e.fn&&!ft.rTmpl.test(n))try{a=e(n,document)[0]}catch(l){}a&&("SCRIPT"!==a.tagName&&S(n+": Use script block, not "+a.tagName),i?n=a.innerHTML:(o=a.getAttribute(Bt),o&&(o!==Qt?(n=dt[o],delete dt[o]):e.fn&&(n=e.data(a)[Qt])),o&&n||(t=t||(e.fn?Qt:n),n=A(t,a.innerHTML,r,i)),n.tmplName=t=t||o,t!==Qt&&(dt[t]=n),a.setAttribute(Bt,t),e.fn&&e.data(a,Qt,n))),a=void 0}else n.fn||(n=void 0);return n}var a,s,l=n=n||"";if(ft._html=pt.html,0===i&&(i=void 0,l=o(l)),i=i||(n.markup?n.bnds?d({},n):n:{}),i.tmplName=i.tmplName||t||"unnamed",r&&(i._parentTmpl=r),!l&&n.markup&&(l=o(n.markup))&&l.fn&&(l=l.markup),void 0!==l)return l.render||n.render?l.tmpls&&(s=l):(n=M(l,i),J(l.replace(Pt,"\\$&"),n)),s||(s=d(function(){return s.render.apply(s,arguments)},n),C(s)),s}function P(t,e){return st(t)?t.call(e):t}function R(t,e,n){Object.defineProperty(t,e,{value:n,configurable:!0})}function N(t,n){function r(t){p.apply(this,t)}function i(){return new r(arguments)}function o(t,e){for(var n,r,i,o,a,s=0;s<x;s++)i=f[s],n=void 0,i+""!==i&&(n=i,i=n.getter,a=n.parentRef),void 0===(o=t[i])&&n&&void 0!==(r=n.defaultVal)&&(o=P(r,t)),e(o,n&&c[n.type],i,a)}function a(e){e=e+""===e?JSON.parse(e):e;var n,r,i,a,d=0,p=e,u=[];if(lt(e)){for(e=e||[],n=e.length;d<n;d++)u.push(this.map(e[d]));return u._is=t,u.unmap=l,u.merge=s,u}if(e){for(o(e,function(t,e){e&&(t=e.map(t)),u.push(t)}),p=this.apply(this,u),d=x;d--;)if(i=u[d],a=f[d].parentRef,a&&i&&i.unmap)if(lt(i))for(n=i.length;n--;)R(i[n],a,p);else R(i,a,p);for(r in e)r===at||w[r]||(p[r]=e[r])}return p}function s(t,e,n){t=t+""===t?JSON.parse(t):t;var r,a,s,l,d,p,u,c,f,g,m=0,h=this;if(lt(h)){for(u={},f=[],a=t.length,s=h.length;m<a;m++){for(c=t[m],p=!1,r=0;r<s&&!p;r++)u[r]||(d=h[r],v&&(u[r]=p=v+""===v?c[v]&&(w[v]?d[v]():d[v])===c[v]:v(d,c)));p?(d.merge(c),f.push(d)):(f.push(g=i.map(c)),n&&R(g,n,e))}return void(b?b(h).refresh(f,!0):h.splice.apply(h,[0,h.length].concat(f)))}o(t,function(t,e,n,r){e?h[n]().merge(t,h,r):h[n]()!==t&&h[n](t)});for(l in t)l===at||w[l]||(h[l]=t[l])}function l(){function t(t){for(var e=[],n=0,r=t.length;n<r;n++)e.push(t[n].unmap());return e}var e,n,r,i,o=0,a=this;if(lt(a))return t(a);for(e={};o<x;o++)n=f[o],r=void 0,n+""!==n&&(r=n,n=r.getter),i=a[n](),e[n]=r&&i&&c[r.type]?lt(i)?t(i):i.unmap():i;for(n in a)!a.hasOwnProperty(n)||"_"===n.charAt(0)&&w[n.slice(1)]||n===at||st(a[n])||(e[n]=a[n]);return e}var d,p,u,c=this,f=n.getters,g=n.extend,v=n.id,m=e.extend({_is:t||"unnamed",unmap:l,merge:s},g),h="",_="",x=f?f.length:0,b=e.observable,w={};for(r.prototype=m,d=0;d<x;d++)!function(t){t=t.getter||t,w[t]=d+1;var e="_"+t;h+=(h?",":"")+t,_+="this."+e+" = "+t+";\n",m[t]=m[t]||function(n){return arguments.length?void(b?b(this).setProperty(t,n):this[e]=n):this[e]},b&&(m[t].set=m[t].set||function(t){this[e]=t})}(f[d]);return _=new Function(h,_),p=function(){_.apply(this,arguments),(u=arguments[x+1])&&R(this,arguments[x],u)},p.prototype=m,m.constructor=p,i.map=a,i.getters=f,i.extend=g,i.id=v,i}function M(t,n){var r,i=vt._wm||{},o={tmpls:[],links:{},bnds:[],_is:"template",render:E};return n&&(o=d(o,n)),o.markup=t,o.htmlTag||(r=Mt.exec(t),o.htmlTag=r?r[1].toLowerCase():""),r=i[o.htmlTag],r&&r!==i.div&&(o.markup=e.trim(o.markup)),o}function F(t,e){function n(i,o,a){var s,l,d,p=ft.onStore[t];if(i&&typeof i===Lt&&!i.nodeType&&!i.markup&&!i.getTgt&&!("viewModel"===t&&i.getters||i.extend)){for(l in i)n(l,i[l],o);return o||ot}return i&&""+i!==i&&(a=o,o=i,i=void 0),d=a?"viewModel"===t?a:a[r]=a[r]||{}:n,s=e.compile,void 0===o&&(o=s?i:d[i],i=void 0),null===o?i&&delete d[i]:(s&&(o=s.call(d,i,o,a,0)||{},o._is=t),i&&(d[i]=o)),p&&p(i,o,a,s),o}var r=t+"s";ot[r]=n}function V(t){mt[t]=mt[t]||function(e){return arguments.length?(gt[t]=e,mt):gt[t]}}function $(t){function e(e,n){this.tgt=t.getTgt(e,n),n.map=this}return st(t)&&(t={getTgt:t}),t.baseMap&&(t=d(d({},t.baseMap),t)),t.map=function(t,n){return new e(t,n)},t}function E(t,e,n,r,i,o){var a,s,l,d,p,u,c,f,g=r,v="";if(e===!0?(n=e,e=void 0):typeof e!==Lt&&(e=void 0),(l=this.tag)?(p=this,g=g||p.view,d=g._getTmpl(l.template||p.tmpl),arguments.length||(t=l.contentCtx&&st(l.contentCtx)?t=l.contentCtx(t):g)):d=this,d){if(!r&&t&&"view"===t._is&&(g=t),g&&t===g&&(t=g.data),u=!g,kt=kt||u,g||((e=e||{}).root=t),!kt||vt.useViews||d.useViews||g&&g!==it)v=O(d,t,e,n,g,i,o,l);else{if(g?(c=g.data,f=g.index,g.index=Ht):(g=it,c=g.data,g.data=t,g.ctx=e),lt(t)&&!n)for(a=0,s=t.length;a<s;a++)g.index=a,g.data=t[a],v+=d.fn(t[a],g,ft);else g.data=t,v+=d.fn(t,g,ft);g.data=c,g.index=f}u&&(kt=void 0)}return v}function O(t,e,n,r,i,o,a,s){var l,p,u,c,f,g,v,m,h,_,x,b,w,y="";if(s&&(h=s.tagName,b=s.tagCtx,n=n?Q(n,s.ctx):s.ctx,t===i.content?v=t!==i.ctx._wrp?i.ctx._wrp:void 0:t!==b.content?t===s.template?(v=b.tmpl,n._wrp=b.content):v=b.content||i.content:v=i.content,b.props.link===!1&&(n=n||{},n.link=!1)),i&&(a=a||i._.onRender,w=n&&n.link===!1,w&&i._.nl&&(a=void 0),n=Q(n,i.ctx),b=!s&&i.tag?i.tag.tagCtxs[i.tagElse]:b),(_=b&&b.props.itemVar)&&("~"!==_[0]&&D("Use itemVar='~myItem'"),_=_.slice(1)),o===!0&&(g=!0,o=0),a&&s&&s._.noVws&&(a=void 0),m=a,a===!0&&(m=void 0,a=i._.onRender),n=t.helpers?Q(t.helpers,n):n,x=n,lt(e)&&!r)for(u=g?i:void 0!==o&&i||new k(n,"array",i,e,t,o,a,v),u._.nl=w,i&&i._.useKey&&(u._.bnd=!s||s._.bnd&&s,u.tag=s),l=0,p=e.length;l<p;l++)c=new k(x,"item",u,e[l],t,(o||0)+l,a,u.content),_&&((c.ctx=d({},x))[_]=ft._cp(e[l],"#data",c)),f=t.fn(e[l],c,ft),y+=u._.onRender?u._.onRender(f,c):f;else u=g?i:new k(x,h||"data",i,e,t,o,a,v),_&&((u.ctx=d({},x))[_]=ft._cp(e,"#data",u)),u.tag=s,u._.nl=w,y+=t.fn(e,u,ft);return s&&(u.tagElse=b.index,b.contentView=u),m?m(y,u):y}function I(t,e,n){var r=void 0!==n?st(n)?n.call(e.data,t,e):n||"":"{Error: "+(t.message||t)+"}";return gt.onError&&void 0!==(n=gt.onError.call(e.data,t,n&&r,e))&&(r=n),e&&!e._lc?pt.html(r):r}function S(t){throw new ft.Err(t)}function D(t){S("Syntax error\n"+t)}function J(t,e,n,r,i){function o(e){e-=v,e&&h.push(t.substr(v,e).replace(jt,"\\n"))}function a(e,n){e&&(e+="}}",D((n?"{{"+n+"}} block has {{/"+e+" without {{"+e:"Unmatched or missing {{/"+e)+", in template:\n"+t))}function s(s,l,d,c,g,x,b,w,y,k,C,T){(b&&l||y&&!d||w&&":"===w.slice(-1)||k)&&D(s),x&&(g=":",c=Kt),y=y||n&&!i;var j,A,P,R=(l||n)&&[[]],N="",M="",F="",V="",$="",E="",O="",I="",S=!y&&!g;d=d||(w=w||"#data",g),o(T),v=T+s.length,b?f&&h.push(["*","\n"+w.replace(/^:/,"ret+= ").replace(At,"$1")+";\n"]):d?("else"===d&&(Nt.test(w)&&D('For "{{else if expr}}" use "{{else expr}}"'),R=_[9]&&[[]],_[10]=t.substring(_[10],T),A=_[11]||_[0]||D("Mismatched: "+s),_=m.pop(),h=_[2],S=!0),w&&L(w.replace(jt," "),R,e,n).replace(Rt,function(t,e,n,r,i,o,a,s){return"this:"===r&&(o="undefined"),s&&(P=P||"@"===s[0]),r="'"+i+"':",a?(M+=n+o+",",V+="'"+s+"',"):n?(F+=r+"j._cp("+o+',"'+s+'",view),',E+=r+"'"+s+"',"):e?O+=o:("trigger"===i&&(I+=o),"lateRender"===i&&(j="false"!==s),N+=r+o+",",$+=r+"'"+s+"',",u=u||$t.test(i)),""}).slice(0,-1),R&&R[0]&&R.pop(),p=[d,c||!!r||u||"",S&&[],q(V||(":"===d?"'#data',":""),$,E),q(M||(":"===d?"data,":""),N,F),O,I,j,P,R||0],h.push(p),S&&(m.push(_),_=p,_[10]=v,_[11]=A)):C&&(a(C!==_[0]&&C!==_[11]&&C,_[0]),_[10]=t.substring(_[10],T),_=m.pop()),a(!_&&C),h=_[2]}var l,d,p,u,c,f=gt.allowCode||e&&e.allowCode||mt.allowCode===!0,g=[],v=0,m=[],h=g,_=[,,g];if(f&&e._is&&(e.allowCode=f),n&&(void 0!==r&&(t=t.slice(0,-r.length-2)+xt),t=ht+t+bt),a(m[0]&&m[0][2].pop()[0]),t.replace(rt,s),o(t.length),(v=g[g.length-1])&&a(""+v!==v&&+v[10]===v[10]&&v[0]),n){for(d=B(g,t,n),c=[],l=g.length;l--;)c.unshift(g[l][9]);U(d,c)}else d=B(g,e);return d}function U(t,e){var n,r,i=0,o=e.length;for(t.deps=[],t.paths=[];i<o;i++){t.paths.push(r=e[i]);for(n in r)"_jsvto"!==n&&r.hasOwnProperty(n)&&r[n].length&&!r[n].skp&&(t.deps=t.deps.concat(r[n]))}}function q(t,e,n){return[t.slice(0,-1),e.slice(0,-1),n.slice(0,-1)]}function K(t,e){return"\n\t"+(e?e+":{":"")+"args:["+t[0]+"],\n\tprops:{"+t[1]+"}"+(t[2]?",\n\tctx:{"+t[2]+"}":"")}function L(t,e,n,r){function i(i,p,x,b,w,y,k,C,T,j,A,P,R,N,M,F,V,$,E,O,I){function S(t,n,i,s,l,d,p,f){var g="."===i;if(i&&(w=w.slice(n.length),/^\.?constructor$/.test(f||w)&&D(t),g||(t=(j?(r?"":"(ltOb.lt=ltOb.lt||")+"(ob=":"")+(s?'view.ctxPrm("'+s+'")':l?"view":"data")+(j?")===undefined"+(r?"":")")+'?"":view._getOb(ob,"':"")+(f?(d?"."+d:s?"":l?"":"."+i)+(p||""):(f=s?"":l?d||"":i,"")),t+=f?"."+f:"",t=n+("view.data"===t.slice(0,9)?t.slice(5):t)+(j?(r?'"':'",ltOb')+(A?",1)":")"):"")),u)){if(K="_linkTo"===o?a=e._jsvto=e._jsvto||[]:c.bd,L=g&&K[K.length-1]){if(L._cpfn){for(;L.sb;)L=L.sb;L.bnd&&(w="^"+w.slice(1)),L.sb=w,L.bnd=L.bnd||"^"===w[0]}}else K.push(w);_[m]=O+(g?1:0)}return t}b&&!C&&(w=b+w),y=y||"",x=x||p||R,w=w||T,j&&(j=!/\)|]/.test(I[O-1]))&&(w=w.slice(1).split(".").join("^")),A=A||$||"";var U,q,K,L,B,Q=")";if("["===A&&(A="[j._sq(",Q=")]"),!k||d||l){if(u&&V&&!d&&!l&&m&&(U=_[m-1],I.length-1>O-(U||0))){if(U=I.slice(U,O+i.length),q!==!0)if(K=a||f[m-1].bd,L=K[K.length-1],L&&L.prm){for(;L.sb&&L.sb.prm;)L=L.sb;B=L.sb={path:L.sb,bnd:L.bnd}}else K.push(B={path:K.pop()});V=_t+":"+U+" onerror=''"+xt,q=v[V],q||(v[V]=!0,v[V]=q=J(V,n,!0)),q!==!0&&B&&(B._cpfn=q,B.prm=c.bd,B.bnd=B.bnd||B.path&&B.path.indexOf("^")>=0)}return d?(d=!N,d?i:R+'"'):l?(l=!M,l?i:R+'"'):(x?(_[m]=O++,c=f[++m]={bd:[]},x):"")+(E?m?"":(g=I.slice(g,O),(o?(o=s=a=!1,"\b"):"\b,")+g+(g=O+i.length,u&&e.push(c.bd=[]),"\b")):C?(m&&D(t),u&&e.pop(),o="_"+w,s=b,g=O+i.length,u&&(u=c.bd=e[o]=[],u.skp=!b),w+":"):w?w.split("^").join(".").replace(ft.rPath,S)+(A?(c=f[++m]={bd:[]},h[m]=Q,A):y):y?y:F?(F=h[m]||F,h[m]=!1,c=f[--m],F+(A?(c=f[++m],h[m]=Q,A):"")):P?(h[m]||D(t),","):p?"":(d=N,l=M,'"'))}D(t)}var o,a,s,l,d,p,u=e&&e[0],c={bd:u},f={0:c},g=0,v=(n?n.links:u&&(u.links=u.links||{}))||it.tmpl.links,m=0,h={},_={};return"@"===t[0]&&(t=t.replace(Dt,".")),p=(t+(n?" ":"")).replace(ft.rPrm,i),!m&&p||D(t)}function B(t,e,n){var r,i,o,a,s,l,d,p,u,c,f,g,v,m,h,_,x,b,w,y,k,C,T,j,A,P,R,N,F,V,$,E,O,I=0,S=vt.useViews||e.useViews||e.tags||e.templates||e.helpers||e.converters,J="",q={},L=t.length;for(""+e===e?(b=n?'data-link="'+e.replace(jt," ").slice(1,-1)+'"':e,e=0):(b=e.tmplName||"unnamed",e.allowCode&&(q.allowCode=!0),e.debug&&(q.debug=!0),f=e.bnds,x=e.tmpls),r=0;r<L;r++)if(i=t[r],""+i===i)J+='\n+"'+i+'"';else if(o=i[0],"*"===o)J+=";\n"+i[1]+"\nret=ret";else{if(a=i[1],k=!n&&i[2],s=K(i[3],"params")+"},"+K(v=i[4]),V=i[6],$=i[7],i[8]?(E="\nvar ob,ltOb={},ctxs=",O=";\nctxs.lt=ltOb.lt;\nreturn ctxs;"):(E="\nreturn ",O=""),C=i[10]&&i[10].replace(At,"$1"),(A="else"===o)?g&&g.push(i[9]):(N=i[5]||gt.debugMode!==!1&&"undefined",f&&(g=i[9])&&(g=[g],I=f.push(1))),S=S||v[1]||v[2]||g||/view.(?!index)/.test(v[0]),(P=":"===o)?a&&(o=a===Kt?">":a+o):(k&&(w=M(C,q),w.tmplName=b+"/"+o,w.useViews=w.useViews||S,B(k,w),S=w.useViews,x.push(w)),A||(y=o,S=S||o&&(!ct[o]||!ct[o].flow),j=J,J=""),T=t[r+1],T=T&&"else"===T[0]),F=N?";\ntry{\nret+=":"\n+",m="",h="",P&&(g||V||a&&a!==Kt||$)){if(R=new Function("data,view,j,u","// "+b+" "+ ++I+" "+o+E+"{"+s+"};"+O),R._er=N,R._tag=o,R._bd=!!g,R._lr=$,n)return R;U(R,g),_='c("'+a+'",view,',c=!0,m=_+I+",",h=")"}if(J+=P?(n?(N?"try{\n":"")+"return ":F)+(c?(c=void 0,S=u=!0,_+(R?(f[I-1]=R,I):"{"+s+"}")+")"):">"===o?(d=!0,"h("+v[0]+")"):(p=!0,"((v="+v[0]+")!=null?v:"+(n?"null)":'"")'))):(l=!0,"\n{view:view,content:false,tmpl:"+(k?x.length:"false")+","+s+"},"),y&&!T){if(J="["+J.slice(0,-1)+"]",_='t("'+y+'",view,this,',n||g){if(J=new Function("data,view,j,u"," // "+b+" "+I+" "+y+E+J+O),J._er=N,J._tag=y,g&&U(f[I-1]=J,g),J._lr=$,n)return J;m=_+I+",undefined,",h=")"}J=j+F+_+(g&&I||J)+")",g=0,y=0}N&&!T&&(S=!0,J+=";\n}catch(e){ret"+(n?"urn ":"+=")+m+"j._err(e,view,"+N+")"+h+";}"+(n?"":"ret=ret"))}J="// "+b+(q.debug?"\ndebugger;":"")+"\nvar v"+(l?",t=j._tag":"")+(u?",c=j._cnvt":"")+(d?",h=j._html":"")+(n?(i[8]?", ob":"")+";\n":',ret=""')+J+(n?"\n":";\nreturn ret;");try{J=new Function("data,view,j,u",J)}catch(Q){D("Compiled template code:\n\n"+J+'\n: "'+(Q.message||Q)+'"')}return e&&(e.fn=J,e.useViews=!!S),J}function Q(t,e){return t&&t!==e?e?d(d({},e),t):t:e&&d({},e)}function H(t,n){var r,i,o=n.map,a=o&&o.propsArr;if(!a){if(a=[],typeof t===Lt||st(t))for(r in t)i=t[r],r===at||!t.hasOwnProperty(r)||n.props.noFunctions&&e.isFunction(i)||a.push({key:r,prop:i});o&&(o.propsArr=o.options&&a)}return W(a,n)}function W(t,n){var r,i,o,a=n.tag,s=n.props,l=n.params.props,d=s.filter,p=s.sort,u=p===!0,c=parseInt(s.step),f=s.reverse?-1:1;if(!lt(t))return t;if(u||p&&""+p===p?(r=t.map(function(t,e){return t=u?t:g(t,p),{i:e,v:""+t===t?t.toLowerCase():t}}),r.sort(function(t,e){return t.v>e.v?f:t.v<e.v?-f:0}),t=r.map(function(e){return t[e.i]})):(p||f<0)&&!a.dataMap&&(t=t.slice()),st(p)&&(t=t.sort(function(){return p.apply(n,arguments)})),f<0&&(!p||st(p))&&(t=t.reverse()),t.filter&&d&&(t=t.filter(d,n),n.tag.onFilter&&n.tag.onFilter(n)),l.sorted&&(r=p||f<0?t:t.slice(),a.sorted?e.observable(a.sorted).refresh(r):n.map.sorted=r),i=s.start,o=s.end,(l.start&&void 0===i||l.end&&void 0===o)&&(i=o=0),isNaN(i)&&isNaN(o)||(i=+i||0,o=void 0===o||o>t.length?t.length:+o,t=t.slice(i,o)),c>1){for(i=0,o=t.length,r=[];i<o;i+=c)r.push(t[i]);t=r}return l.paged&&a.paged&&$observable(a.paged).refresh(t),t}function Z(t,n,r){var i=this.jquery&&(this[0]||S("Unknown template")),o=i.getAttribute(Bt);return E.call(o&&e.data(i)[Qt]||dt(i),t,n,r)}function z(t){return Ut[t]||(Ut[t]="&#"+t.charCodeAt(0)+";")}function G(t,e){return qt[e]||""}function X(t){return void 0!=t?Vt.test(t)&&(""+t).replace(Ot,z)||t:""}function Y(t){return""+t===t?t.replace(It,z):t}function tt(t){return""+t===t?t.replace(St,G):t}var et=e===!1;e=e&&e.fn?e:t.jQuery;var nt,rt,it,ot,at,st,lt,dt,pt,ut,ct,ft,gt,vt,mt,ht,_t,xt,bt,wt,yt,kt,Ct="v1.0.5",Tt="_ocp",jt=/[ \t]*(\r\n|\n|\r)/g,At=/\\(['"])/g,Pt=/['"\\]/g,Rt=/(?:\x08|^)(onerror:)?(?:(~?)(([\w$.]+):)?([^\x08]+))\x08(,)?([^\x08]+)/gi,Nt=/^if\s/,Mt=/<(\w+)[>\s]/,Ft=/[\x00`><"'&=]/g,Vt=/[\x00`><\"'&=]/,$t=/^on[A-Z]|^convert(Back)?$/,Et=/^\#\d+_`[\s\S]*\/\d+_`$/,Ot=Ft,It=/[&<>]/g,St=/&(amp|gt|lt);/g,Dt=/\[['"]?|['"]?\]/g,Jt=0,Ut={"&":"&amp;","<":"&lt;",">":"&gt;","\0":"&#0;","'":"&#39;",'"':"&#34;","`":"&#96;","=":"&#61;"},qt={amp:"&",gt:">",lt:"<"},Kt="html",Lt="object",Bt="data-jsv-tmpl",Qt="jsvTmpl",Ht="For #index in nested block use #getIndex().",Wt={},Zt=t.jsrender,zt=Zt&&e&&!e.render,Gt={template:{compile:A},tag:{compile:T},viewModel:{compile:N},helper:{},converter:{}};if(ot={jsviews:Ct,sub:{rPath:/^(!*?)(?:null|true|false|\d[\d.]*|([\w$]+|\.|~([\w$]+)|#(view|([\w$]+))?)([\w$.^]*?)(?:[.[^]([\w$]+)\]?)?)$/g,rPrm:/(\()(?=\s*\()|(?:([([])\s*)?(?:(\^?)(~?[\w$.^]+)?\s*((\+\+|--)|\+|-|~(?![\w$])|&&|\|\||===|!==|==|!=|<=|>=|[<>%*:?\/]|(=))\s*|(!*?(@)?[#~]?[\w$.^]+)([([])?)|(,\s*)|(\(?)\\?(?:(')|("))|(?:\s*(([)\]])(?=[.^]|\s*$|[^([])|[)\]])([([]?))|(\s+)/g,View:k,Err:l,tmplFn:J,parse:L,extend:d,extendCtx:Q,syntaxErr:D,onStore:{template:function(t,e){null===e?delete Wt[t]:t&&(Wt[t]=e)}},addSetting:V,settings:{allowCode:!1},advSet:a,_thp:i,_gm:r,_tg:function(){},_cnvt:h,_tag:y,_er:S,_err:I,_cp:o,_sq:function(t){return"constructor"===t&&D(""),t}},settings:{delimiters:p,advanced:function(t){return t?(d(vt,t),ft.advSet(),mt):vt}},map:$},(l.prototype=new Error).constructor=l,c.depends=function(){return[this.get("item"),"index"]},f.depends="index",k.prototype={get:u,getIndex:f,ctxPrm:v,getRsc:w,_getTmpl:m,_getOb:g,_is:"view"},ft=ot.sub,mt=ot.settings,!(Zt||e&&e.render)){for(nt in Gt)F(nt,Gt[nt]);if(pt=ot.converters,ut=ot.helpers,ct=ot.tags,ft._tg.prototype={baseApply:j,cvtArgs:_,bndArgs:b,ctxPrm:v},it=ft.topView=new k,e){if(e.fn.render=Z,at=e.expando,e.observable){if(Ct!==(Ct=e.views.jsviews))throw"JsObservable requires JsRender "+Ct;d(ft,e.views.sub),ot.map=e.views.map}}else e={},et&&(t.jsrender=e),e.renderFile=e.__express=e.compile=function(){throw"Node.js: use npm jsrender, or jsrender-node.js"},e.isFunction=function(t){return"function"==typeof t},e.isArray=Array.isArray||function(t){return"[object Array]"==={}.toString.call(t)},ft._jq=function(t){t!==e&&(d(t,e),e=t,e.fn.render=Z,delete e.jsrender,at=e.expando)},e.jsrender=Ct;gt=ft.settings,gt.allowCode=!1,st=e.isFunction,e.render=Wt,e.views=ot,e.templates=dt=ot.templates;for(yt in gt)V(yt);(mt.debugMode=function(t){return void 0===t?gt.debugMode:(gt.debugMode=t,gt.onError=t+""===t?function(){return t}:st(t)?t:void 0,mt)})(!1),vt=gt.advanced={useViews:!1,_jsv:!1},ct({"if":{render:function(t){var e=this,n=e.tagCtx,r=e.rendering.done||!t&&(n.args.length||!n.index)?"":(e.rendering.done=!0,void(e.selected=n.index));return r},contentCtx:!0,flow:!0},"for":{sortDataMap:$(W),init:function(t,e){this.setDataMap(this.tagCtxs)},render:function(t){var e,n,r,i,o,a=this,s=a.tagCtx,l=s.argDefault===!1,d=s.props,p=l||s.args.length,u="",c=0;if(!a.rendering.done){if(e=p?t:s.view.data,l)for(l=d.reverse?"unshift":"push",i=+d.end,o=+d.step||1,e=[],r=+d.start||0;(i-r)*o>0;r+=o)e[l](r);void 0!==e&&(n=lt(e),u+=s.render(e,!p||d.noIteration),c+=n?e.length:1),(a.rendering.done=c)&&(a.selected=s.index)}return u},setDataMap:function(t){for(var e,n,r,i=this,o=t.length;o--;)e=t[o],n=e.props,r=e.params.props,e.argDefault=void 0===n.end||e.args.length>0,n.dataMap=e.argDefault!==!1&&lt(e.args[0])&&(r.sort||r.start||r.end||r.step||r.filter||r.reverse||n.sort||n.start||n.end||n.step||n.filter||n.reverse)&&i.sortDataMap},flow:!0},props:{baseTag:"for",dataMap:$(H),init:a,flow:!0},include:{flow:!0},"*":{render:o,flow:!0},":*":{render:o,flow:!0},dbg:ut.dbg=pt.dbg=s}),pt({html:X,attr:X,encode:Y,unencode:tt,url:function(t){return void 0!=t?encodeURI(""+t):null===t?t:""}})}return gt=ft.settings,lt=(e||Zt).isArray,mt.delimiters("{{","}}","^"),zt&&Zt.views.sub._jq(e),e||Zt},window);
//# sourceMappingURL=jsrender.min.js.map
;
/*!
 Leaflet.FeatureGroup.SubGroup 1.0.2+00bb0d4
 (c) 2015-2017 Boris Seang
 License BSD-2-Clause
 */

!function(e,r){"function"==typeof define&&define.amd?define(["leaflet"],r):r("object"==typeof module&&module.exports?require("leaflet"):e.L)}(this,function(e){e.FeatureGroup.SubGroup=e.FeatureGroup.extend({initialize:function(r,t){e.FeatureGroup.prototype.initialize.call(this,t),this.setParentGroup(r)},setParentGroup:function(r){var t=r instanceof e.LayerGroup;return this._parentGroup=r,this.onAdd=t?"function"==typeof r.addLayers?this._onAddToGroupBatch:this._onAddToGroup:this._onAddToMap,this.onRemove=t?"function"==typeof r.removeLayers?this._onRemoveFromGroupBatch:this._onRemoveFromGroup:this._onRemoveFromMap,this.addLayer=t?this._addLayerToGroup:this._addLayerToMap,this.removeLayer=t?this._removeLayerFromGroup:this._removeLayerFromMap,this},setParentGroupSafe:function(e){var r=this._map;return r&&r.removeLayer(this),this.setParentGroup(e),r&&r.addLayer(this),this},getParentGroup:function(){return this._parentGroup},_onAddToGroupBatch:function(e){var r=this.getLayers();this._map=e,this._parentGroup.addLayers(r)},_onRemoveFromGroupBatch:function(){var e=this.getLayers();this._parentGroup.removeLayers(e),this._map=null},_onAddToGroup:function(e){var r=this._parentGroup;this._map=e,this.eachLayer(r.addLayer,r)},_onRemoveFromGroup:function(){var e=this._parentGroup;this.eachLayer(e.removeLayer,e),this._map=null},_onAddToMap:e.FeatureGroup.prototype.onAdd,_onRemoveFromMap:e.FeatureGroup.prototype.onRemove,_addLayerToGroup:function(e){if(this.hasLayer(e))return this;e.addEventParent(this);var r=this.getLayerId(e);return this._layers[r]=e,this._map&&this._parentGroup.addLayer(e),this.fire("layeradd",{layer:e})},_removeLayerFromGroup:function(e){if(!this.hasLayer(e))return this;var r=e in this._layers?e:this.getLayerId(e);return e=this._layers[r],e.removeEventParent(this),this._map&&e&&this._parentGroup.removeLayer(e),delete this._layers[r],this.fire("layerremove",{layer:e})},_addLayerToMap:e.FeatureGroup.prototype.addLayer,_removeLayerFromMap:e.FeatureGroup.prototype.removeLayer}),e.featureGroup.subGroup=function(r,t){return new e.FeatureGroup.SubGroup(r,t)}});
'use strict';

(function (exports) {

  var getCategory = function getCategory(category) {
    var defaultCat = {
      color: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
      children: function children() {},
      parent: null,
      name: null
    };
    if (category) {
      var _ret = (function () {
        var id = category.id ? parseInt(category.id, 10) : parseInt(category, 10);
        var cat = exports.AwesomeMap.categories.find(function (c) {
          return c.id == id;
        });
        if (cat) {
          cat.children = function () {
            return exports.AwesomeMap.categories.filter(function (c) {
              return c.parent === cat.id;
            });
          };
          return {
            v: cat
          };
        }
      })();

      if (typeof _ret === 'object') return _ret.v;
    }
    return defaultCat;
  };

  exports.AwesomeMap = exports.AwesomeMap || {};
  exports.AwesomeMap.getCategory = getCategory;
})(window);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ApiFetcher = (function () {
  // eslint-disable-line no-unused-vars

  function ApiFetcher(query, variables) {
    _classCallCheck(this, ApiFetcher);

    this.query = query;
    this.variables = variables;
  }

  _createClass(ApiFetcher, [{
    key: "fetch",
    value: function fetch(callback) {
      $.ajax({
        method: "POST",
        url: "/api",
        contentType: "application/json",
        data: JSON.stringify({
          query: this.query,
          variables: this.variables
        })
      }).done(function (data) {
        callback(data.data);
      });
    }
  }, {
    key: "fetchAll",
    value: function fetchAll(callback) {
      this.fetch(callback);
    }
  }], [{
    key: "findTranslation",
    value: function findTranslation(translations) {
      var text = undefined,
          lang = document.querySelector('html').getAttribute('lang');

      translations.forEach(function (t) {
        if (t.text) {
          if (!text || t.locale == lang) {
            text = t.text;
          }
        }
      });
      return text;
    }
  }]);

  return ApiFetcher;
})();
"use strict";

(function (exports) {
  var getCategory = exports.AwesomeMap.getCategory;

  var query = "query ($id: ID!, $after: String!) {\n    component(id: $id) {\n        id\n        __typename\n        ... on Proposals {\n          proposals(first: 50, after: $after){\n            pageInfo {\n              hasNextPage\n              endCursor\n            }\n            edges {\n              node {  \n                id\n                state\n                title {\n                  translations {\n                    text\n                    locale\n                  }\n                }\n                body {\n                  translations {\n                    text\n                    locale\n                  }\n                }\n                address\n                coordinates {\n                  latitude\n                  longitude\n                }\n                amendments {\n                  emendation {\n                    id\n                  }\n                }\n                category {\n                  id\n                }\n              }\n            }\n          }\n        }\n      }\n    }";

  var ProposalIcon = L.DivIcon.SVGIcon.DecidimIcon;

  var createMarker = function createMarker(element, callback) {
    var marker = L.marker([element.coordinates.latitude, element.coordinates.longitude], {
      icon: new ProposalIcon({
        fillColor: getCategory(element.category).color
      })
    });

    element.title.translation = ApiFetcher.findTranslation(element.title.translations);
    element.body.translation = ApiFetcher.findTranslation(element.body.translations).replace(/\n/g, "<br>");

    callback(element, marker);
  };

  var fetchProposals = function fetchProposals(component, after, callback) {
    var finalCall = arguments.length <= 3 || arguments[3] === undefined ? function () {} : arguments[3];

    var variables = {
      "id": component.id,
      "after": after
    };
    var api = new ApiFetcher(query, variables);
    api.fetchAll(function (result) {
      if (result) {
        result.component.proposals.edges.forEach(function (element) {
          if (!element.node) return;

          if (element.node.coordinates) {
            element.node.link = component.url + '/proposals/' + element.node.id;
            createMarker(element.node, callback);
          }
        });
        if (result.component.proposals.pageInfo.hasNextPage) {
          fetchProposals(component, result.component.proposals.pageInfo.endCursor, callback, finalCall);
        } else {
          finalCall();
        }
      }
    });
  };

  exports.AwesomeMap = exports.AwesomeMap || {};
  exports.AwesomeMap.fetchProposals = fetchProposals;
})(window);
"use strict";

(function (exports) {
  var getCategory = exports.AwesomeMap.getCategory;

  var query = "query ($id: ID!, $after: String!) {\n    component(id: $id) {\n        id\n        __typename\n        ... on Meetings {\n          meetings(first: 50, after: $after) {\n            pageInfo {\n              hasNextPage\n              endCursor\n            }\n            edges {\n              node {\n                id\n                title {\n                  translations {\n                    text\n                    locale\n                  }\n                }\n                description {\n                  translations {\n                    text\n                    locale\n                  }\n                }\n                startTime\n                location {\n                  translations {\n                    text\n                    locale\n                  }\n                }\n                address\n                locationHints {\n                  translations {\n                    text\n                    locale\n                  }\n                }\n                coordinates {\n                  latitude\n                  longitude\n                }\n                category {\n                  id\n                }\n              }\n            }\n          }\n        }\n      }\n    }";

  var MeetingIcon = L.DivIcon.SVGIcon.extend({
    options: {
      fillColor: "#ef604d",
      iconSize: { x: 300, y: 150 },
      opacity: 0
    },
    _createPathDescription: function _createPathDescription() {
      return "M 15.991543,4 C 7.3956015,4 2.9250351,10.5 3.000951,16.999999 3.1063486,26.460968 12.747693,30.000004 15.991543,43 19.242091,30.000004 29,26.255134 29,16.999999 29,10.5 23.951131,4 15.996007,4 m -0.153508,2.6000001 a 2.1720294,2.1076698 0 0 1 2.330514,2.1124998 2.177008,2.1125006 0 0 1 -4.354016,0 2.1720294,2.1076698 0 0 1 2.023502,-2.1124998 m -2.651707,4.8056679 h 5.610202 l 3.935584,7.569899 -1.926038,0.934266 -2.009546,-3.859265 v 14.557403 h -2.484243 v -9.126003 h -0.642162 v 9.126003 H 13.190347 V 16.050568 l -2.009545,3.859265 -1.926036,-0.934266 3.935581,-7.569899";
    },
    _createCircle: function _createCircle() {
      return "";
    },
    // Improved version of the _createSVG, essentially the same as in later
    // versions of Leaflet. It adds the `px` values after the width and height
    // CSS making the focus borders work correctly across all browsers.
    _createSVG: function _createSVG() {
      var path = this._createPath();
      var circle = this._createCircle();
      var text = this._createText();
      var className = this.options.className + "-svg";

      var style = "width:" + this.options.iconSize.x + "px; height:" + this.options.iconSize.y + "px;";

      var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" class=\"" + className + "\" style=\"" + style + "\">" + path + circle + text + "</svg>";

      return svg;
    }
  });

  var createMarker = function createMarker(element, callback) {
    var marker = L.marker([element.coordinates.latitude, element.coordinates.longitude], {
      icon: new MeetingIcon({
        fillColor: getCategory(element.category).color
      })
    });

    element.title.translation = ApiFetcher.findTranslation(element.title.translations);
    element.description.translation = ApiFetcher.findTranslation(element.description.translations).replace(/\n/g, "<br>");;
    element.location.translation = ApiFetcher.findTranslation(element.location.translations);
    element.locationHints.translation = ApiFetcher.findTranslation(element.locationHints.translations);
    callback(element, marker);
  };

  var fetchMeetings = function fetchMeetings(component, after, callback) {
    var finalCall = arguments.length <= 3 || arguments[3] === undefined ? function () {} : arguments[3];

    var variables = {
      "id": component.id,
      "after": after
    };
    var api = new ApiFetcher(query, variables);
    api.fetchAll(function (result) {
      if (result) {
        result.component.meetings.edges.forEach(function (element) {
          if (!element.node) return;

          if (element.node.coordinates) {
            element.node.link = component.url + '/meetings/' + element.node.id;
            createMarker(element.node, callback);
          }
        });

        if (result.component.meetings.pageInfo.hasNextPage) {
          fetchMeetings(component, result.component.meetings.pageInfo.endCursor, callback, finalCall);
        } else {
          finalCall();
        }
      }
    });
  };

  exports.AwesomeMap = exports.AwesomeMap || {};
  exports.AwesomeMap.fetchMeetings = fetchMeetings;
})(window);
"use strict";

(function (exports) {
  var _exports$AwesomeMap = exports.AwesomeMap;
  var fetchProposals = _exports$AwesomeMap.fetchProposals;
  var fetchMeetings = _exports$AwesomeMap.fetchMeetings;
  var getCategory = _exports$AwesomeMap.getCategory;

  var collapsedMenu = $("#awesome-map").data("collapsed");
  var show = {
    withdrawn: $("#awesome-map").data("show-withdrawn"),
    accepted: $("#awesome-map").data("show-accepted"),
    evaluating: $("#awesome-map").data("show-evaluating"),
    notAnswered: $("#awesome-map").data("show-not-answered"),
    rejected: $("#awesome-map").data("show-rejected")
  };
  var components = $("#awesome-map").data("components");
  var popupMeetingTemplateId = "marker-meeting-popup";
  var popupProposalTemplateId = "marker-proposal-popup";

  var cluster = L.markerClusterGroup();
  var amendments = [];

  var layers = {};

  var control = L.control.layers(null, null, {
    position: 'topleft',
    sortLayers: false,
    collapsed: collapsedMenu
  });
  // hideSingleBase: true
  var allMarkers = [];

  var drawMarker = function drawMarker(element, marker, component) {
    var tmpl = component.type === "proposals" ? popupProposalTemplateId : popupMeetingTemplateId,
        node = document.createElement("div");

    $($.templates("#" + tmpl).render(element)).appendTo(node);

    marker.bindPopup(node, {
      maxwidth: 640,
      minWidth: 500,
      keepInView: true,
      className: "map-info"
    }).openPopup();

    allMarkers.push({
      marker: marker,
      component: component,
      element: element
    });

    // Check if it has amendments, add it to a list
    if (element.amendments && element.amendments.length) {
      element.amendments.forEach(function (amendment) {
        amendments.push(amendment.emendation.id);
      });
    }
    // Add to category layer
    var cat = getCategory(element.category);
    if (layers[cat.id]) {
      marker.addTo(layers[cat.id].group);
      // show category if hidden
      var $label = $(".awesome_map-category_" + cat.id).closest("label");
      var $parent = $(".awesome_map-category_" + cat.parent).closest("label");
      $label.show();
      // update number of items
      $label.attr("title", parseInt($label.attr("title") || 0) + 1);
      // show parent if apply
      $parent.show();
      $parent.attr("title", parseInt($parent.attr("title") || 0) + 1);
      // update component stats
      var $component = $("#awesome_map-component-" + component.id);
      $component.attr("title", parseInt($component.attr("title") || 0) + 1);
    }

    return marker;
  };

  var loadElements = function loadElements(map) {
    // legends
    control.addTo(map);
    cluster.addTo(map);

    // Load markers
    components.forEach(function (component) {
      if (component.type == "proposals") {
        // add control layer for proposals
        layers.proposals = {
          label: "<span id=\"awesome_map-component-" + component.id + "\" title=\"0\">" + (component.name || window.DecidimAwesome.texts.proposals) + "</span>",
          group: L.featureGroup.subGroup(cluster)
        };
        control.addOverlay(layers.proposals.group, layers.proposals.label);
        layers.proposals.group.addTo(map);

        // add control layer for amendments if any
        if (component.amendments) {
          layers.amendments = {
            label: "<span id=\"awesome_map-component-" + component.d + "\" title=\"0\">" + window.DecidimAwesome.texts.amendments + "</span>",
            group: L.featureGroup.subGroup(cluster)
          };
          control.addOverlay(layers.amendments.group, layers.amendments.label);
          layers.amendments.group.addTo(map);
        }

        fetchProposals(component, '', function (element, marker) {
          console.log(element.state, show[element.state || 'notAnswered'], show, element);
          if (show[element.state || 'notAnswered']) {
            drawMarker(element, marker, component).addTo(layers.proposals.group);
          }
        }, function () {
          // finall call
          map.fitBounds(cluster.getBounds(), { padding: [50, 50] });
          allMarkers.forEach(function (item) {
            // add marker to amendments layers if it's an amendment
            if (amendments.find(function (a) {
              return a == item.element.id;
            })) {
              item.marker.removeFrom(layers.proposals.group);
              item.marker.addTo(layers.amendments.group);
            }
          });
        });
      }

      if (component.type == "meetings") {
        // add control layer for meetings
        layers.meetings = {
          label: "<span id=\"awesome_map-component-" + component.id + "\" title=\"0\">" + (component.name || window.DecidimAwesome.texts.meetings) + "</span>",
          group: L.featureGroup.subGroup(cluster)
        };
        control.addOverlay(layers.meetings.group, layers.meetings.label);
        layers.meetings.group.addTo(map);

        fetchMeetings(component, '', function (element, marker) {
          drawMarker(element, marker, component).addTo(layers.meetings.group);
        }, function () {
          map.fitBounds(cluster.getBounds(), { padding: [50, 50] });
        });
      }
    });

    // add categories control layers
    if (window.AwesomeMap.categories.length) {
      (function () {
        var lastLayer = layers[Object.keys(layers)[Object.keys(layers).length - 1]];
        // Add Categories "title"
        if (lastLayer) {
          lastLayer.label = lastLayer.label + "<hr><b>" + window.DecidimAwesome.texts.categories + "</b>";
          control.removeLayer(lastLayer.group);
          control.addOverlay(lastLayer.group, lastLayer.label);
        }

        window.AwesomeMap.categories.forEach(function (category) {
          // add control layer for this category
          layers[category.id] = {
            label: "<i class=\"awesome_map-category_" + category.id + "\"></i> " + category.name,
            group: L.featureGroup.subGroup(cluster)
          };
          layers[category.id].group.addTo(map);
          control.addOverlay(layers[category.id].group, layers[category.id].label);
          // hide layer by default, it will be activated if there's any marker in it
          setTimeout(function () {
            $(".awesome_map-category_" + category.id).closest("label").hide();
          });
        });

        // watch events for subcategories syncronitzation
        var getCatFromClass = function getCatFromClass(name) {
          var id = name.match(/awesome_map-category_(\d+)/);
          if (!id) return;
          var cat = getCategory(id[1]);
          if (!cat || !cat.name) return;

          return cat;
        };

        var indeterminateInput = function indeterminateInput(id) {
          $('[class^="awesome_map-category_"]').parent().prev().prop("indeterminate", false);
          if (id) {
            var $input = $(".awesome_map-category_" + id).parent().prev();
            if (!$input.prop("checked")) {
              $input.prop("indeterminate", true);
            }
          }
        };

        map.on('overlayadd', function (e) {
          var cat = getCatFromClass(e.name);
          if (!cat) return;
          // if it's a children, put the parent to indeterminate
          indeterminateInput(cat.parent);
        });

        // on remove a parent category, remove all children
        map.on('overlayremove', function (e) {
          var cat = getCatFromClass(e.name);
          if (!cat) return;
          cat.children().forEach(function (c) {
            var $el = $(".awesome_map-category_" + c.id);
            if ($el.parent().prev().prop("checked")) {
              $el.click();
            }
          });
        });
      })();
    }
  };

  $("#map").on("ready.decidim", function (ev, map) {
    loadElements(map);
  });
})(window);
