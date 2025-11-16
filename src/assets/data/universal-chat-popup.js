(function(h,a){typeof exports=="object"&&typeof module<"u"?a(exports):typeof define=="function"&&define.amd?define(["exports"],a):(h=typeof globalThis<"u"?globalThis:h||self,a(h.UniversalChatPopup={}))})(this,function(h){"use strict";var M=Object.defineProperty;var v=(h,a,u)=>a in h?M(h,a,{enumerable:!0,configurable:!0,writable:!0,value:u}):h[a]=u;var n=(h,a,u)=>v(h,typeof a!="symbol"?a+"":a,u);class a extends HTMLElement{constructor(){super();n(this,"shadow");this.shadow=this.attachShadow({mode:"closed"})}addStyles(e){const t=new CSSStyleSheet;t.replaceSync(e),this.shadow.adoptedStyleSheets=[t]}createElement(e,t,s){const i=document.createElement(e);return t&&(i.className=t),s&&(i.textContent=s),i}}class u extends a{constructor(){super();n(this,"styles",`
    .launcher {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(19, 47, 186, 0.3);
      transition: all 0.3s ease;
      position: relative;
      overflow: visible;
      border: 3px solid #FFFEFA;
    }

    .launcher::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 50%;
      background: linear-gradient(45deg, #132FBA, #799CF0, #FFF6D2, #132FBA);
      background-size: 400% 400%;
      animation: sparkle 3s ease infinite;
      z-index: -1;
      opacity: 0.4;
    }

    @keyframes sparkle {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .launcher:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(19, 47, 186, 0.5);
    }

    .launcher svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    .launcher img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
  `);n(this,"isOpen",!1);this.addStyles(this.styles),this.render()}static get observedAttributes(){return["theme-color","avatar"]}attributeChangedCallback(e,t,s){t!==s&&(e==="theme-color"||e==="avatar")&&this.render()}render(){this.shadow.innerHTML="";const e=this.createElement("button","launcher");e.innerHTML=this.getChatIcon(),e.addEventListener("click",()=>this.toggleChat()),this.shadow.appendChild(e)}toggleChat(){this.isOpen=!this.isOpen,this.dispatchEvent(new CustomEvent("toggleChat",{detail:{isOpen:this.isOpen},bubbles:!0,composed:!0}))}getChatIcon(){const e=this.getAttribute("avatar");return e?`<img src="${e}" alt="Chat avatar">`:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`}}customElements.define("chat-launcher",u);class m{constructor(o){n(this,"storageKey");this.storageKey=`chat_history_${btoa(o)}`}getMessages(){try{const o=localStorage.getItem(this.storageKey);return o?JSON.parse(o):[]}catch(o){return console.error("Failed to load chat history:",o),[]}}addMessage(o){try{const e=this.getMessages();e.push(o),localStorage.setItem(this.storageKey,JSON.stringify(e))}catch(e){console.error("Failed to save message:",e)}}updateMessage(o,e){try{const t=this.getMessages(),s=t.findIndex(i=>i.id===o);s!==-1&&(t[s]={...t[s],...e},localStorage.setItem(this.storageKey,JSON.stringify(t)))}catch(t){console.error("Failed to update message:",t)}}clearHistory(){try{localStorage.removeItem(this.storageKey)}catch(o){console.error("Failed to clear history:",o)}}}class b{constructor(o){n(this,"url");n(this,"controller",null);this.url=o}async sendMessage(o){this.controller&&this.controller.abort(),this.controller=new AbortController;try{const e=await fetch(this.url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o),signal:this.controller.signal});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.json();return this.controller=null,t}catch(e){throw e instanceof Error&&e.name==="AbortError"?new Error("Request cancelled"):e}}cancelRequest(){this.controller&&(this.controller.abort(),this.controller=null)}}class C extends a{constructor(){super();n(this,"styles",`
    .chat-window {
      position: absolute;
      bottom: 0;
      right: 84px;
      left: auto;
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.3s ease, transform 0.3s ease, width 0.3s ease, height 0.3s ease;
      pointer-events: none;
    }

    .chat-window.open {
      opacity: 1;
      transform: translateX(0);
      pointer-events: all;
    }

    .chat-window.expanded {
      width: 600px;
      height: 700px;
    }

    :host([position="bottom-left"]) .chat-window {
      right: 84px;
      left: auto;
    }

    .header {
      padding: 12px 20px;
      background: #FFFEFA;
      color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 20px 20px 0 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .header h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #333;
    }

    .header-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #FFF6D2;
    }

    .header-sparkle {
      font-size: 14px;
      margin-left: 2px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .header button {
      background: transparent;
      border: 1.5px solid #132FBA;
      color: #132FBA;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      font-size: 16px;
      transition: all 0.2s;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .header button:hover {
      background: #132FBA;
      color: white;
      transform: scale(1.05);
    }

    .header-icon {
      width: 16px;
      height: 16px;
      fill: currentColor;
      stroke: currentColor;
      stroke-width: 0;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #FFFEFA;
    }

    .messages-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .messages::-webkit-scrollbar {
      width: 6px;
    }

    .messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages::-webkit-scrollbar-thumb {
      background: #799CF0;
      border-radius: 3px;
    }

    .message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      position: relative;
    }

    .message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #132FBA 0%, #799CF0 100%);
      color: white;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 8px rgba(19, 47, 186, 0.2);
    }

    .message.user .message-text {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .message.backend {
      align-self: flex-start;
      background: white;
      color: #333;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 4px rgba(19, 47, 186, 0.1);
      border: 1px solid rgba(19, 47, 186, 0.1);
      display: flex;
      gap: 8px;
      align-items: flex-start;
      max-width: 85%;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #FFF6D2;
      flex-shrink: 0;
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message.backend .message-text {
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .message.system {
      align-self: center;
      background: transparent;
      color: #999;
      font-style: italic;
      font-size: 12px;
      padding: 8px;
    }

    .message.error {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .typing-indicator {
      align-self: flex-start;
      background: white;
      padding: 12px 16px;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 4px rgba(19, 47, 186, 0.1);
      border: 1px solid rgba(19, 47, 186, 0.1);
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #799CF0;
      animation: typing 1.4s infinite;
    }

    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }

    .branding-section {
      padding: 24px 20px;
      background: #FFFEFA;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      position: relative;
      flex-shrink: 0;
    }

    .branding-avatar-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .branding-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #FFF6D2;
      box-shadow: 0 4px 12px rgba(19, 47, 186, 0.15);
    }

    .branding-typing-bubble {
      position: absolute;
      top: -10px;
      right: -10px;
      background: #FFF6D2;
      border-radius: 18px;
      padding: 8px 12px;
      display: none;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .branding-typing-bubble.show {
      display: flex;
    }

    .branding-typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #132FBA;
      animation: brandingTyping 1.4s infinite;
    }

    .branding-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .branding-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes brandingTyping {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-6px);
        opacity: 1;
      }
    }

    .branding-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
      font-weight: 700;
      color: #132FBA;
      margin-top: 8px;
    }

    .branding-ai-badge {
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .branding-description {
      font-size: 13px;
      color: #132FBA;
      text-align: center;
      line-height: 1.5;
      max-width: 280px;
    }

    .input-area {
      padding: 16px 20px;
      border-top: 1px solid rgba(19, 47, 186, 0.1);
      display: flex;
      gap: 10px;
      background: #FFFEFA;
      align-items: center;
    }

    .input-area input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid rgba(19, 47, 186, 0.2);
      border-radius: 24px;
      font-size: 14px;
      background: #FFF6D2;
      color: #333;
      outline: none;
      transition: all 0.2s;
    }

    .input-area input:focus {
      border-color: #132FBA;
      background: white;
      box-shadow: 0 0 0 3px rgba(19, 47, 186, 0.1);
    }

    .input-area input::placeholder {
      color: #999;
    }

    .input-area button {
      background: linear-gradient(135deg, #132FBA 0%, #799CF0 100%);
      color: white;
      border: none;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(19, 47, 186, 0.3);
      padding: 0;
    }

    .input-area button::before {
      content: '↑';
      font-size: 20px;
      line-height: 1;
    }

    .input-area button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(19, 47, 186, 0.4);
    }

    .input-area button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .suggested-topics {
      padding: 0 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #FFFEFA;
    }

    .topic-button {
      padding: 10px 16px;
      background: white;
      border: 1px solid rgba(19, 47, 186, 0.2);
      border-radius: 12px;
      font-size: 13px;
      color: #333;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .topic-button:hover {
      background: #FFF6D2;
      border-color: #132FBA;
      transform: translateX(4px);
    }

    .disclaimer {
      padding: 8px 20px;
      font-size: 11px;
      color: #999;
      text-align: center;
      background: #FFFEFA;
      border-top: 1px solid rgba(19, 47, 186, 0.1);
    }
  `);n(this,"isOpen",!1);n(this,"storage");n(this,"webhook");n(this,"sessionId");n(this,"hasShownWelcomeMessage",!1);n(this,"isTyping",!1);n(this,"isExpanded",!1);n(this,"typingIndicator",null);const e=this.getAttribute("webhook-url")||"";this.storage=new m(e),this.webhook=new b(e),this.sessionId=crypto.randomUUID(),this.addStyles(this.styles),this.render()}static get observedAttributes(){return["webhook-url","title","welcome-message","history-enabled","history-clear-button","position","avatar"]}render(){const e=this.createElement("div","chat-window"),t=this.createElement("div","header"),o=this.createElement("div","header-left");const avatar=this.getAttribute("avatar");if(avatar){const avatarImg=document.createElement("img");avatarImg.className="header-avatar",avatarImg.src=avatar,avatarImg.alt="Assistant avatar",o.appendChild(avatarImg)}const s=this.createElement("h2","");const titleText=this.getAttribute("title")||"Chat with us";s.appendChild(document.createTextNode(titleText));const sparkle=document.createElement("span");sparkle.className="header-sparkle",sparkle.textContent="✨",s.appendChild(sparkle),o.appendChild(s),t.appendChild(o);const i=this.createElement("div","header-actions");const refreshBtn=this.createElement("button","","");refreshBtn.title="Refresh",refreshBtn.innerHTML='<svg class="header-icon" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',refreshBtn.addEventListener("click",()=>this.handleRefresh()),i.appendChild(refreshBtn);const expandBtn=this.createElement("button","","");expandBtn.title="Expand",expandBtn.innerHTML='<svg class="header-icon" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',expandBtn.addEventListener("click",()=>this.toggleExpand()),i.appendChild(expandBtn);const closeBtn=this.createElement("button","","");closeBtn.title="Close",closeBtn.innerHTML='<svg class="header-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',closeBtn.addEventListener("click",()=>this.close()),i.appendChild(closeBtn),t.appendChild(i);const branding=this.createElement("div","branding-section");const avatarContainer=this.createElement("div","branding-avatar-container");const brandingAvatar=document.createElement("img");brandingAvatar.className="branding-avatar",brandingAvatar.src=avatar||"",brandingAvatar.alt="Pana Assistant",avatarContainer.appendChild(brandingAvatar);const typingBubble=this.createElement("div","branding-typing-bubble");for(let idx=0;idx<3;idx++){const dot=this.createElement("div","branding-typing-dot");typingBubble.appendChild(dot)}avatarContainer.appendChild(typingBubble),this.brandingTypingBubble=typingBubble,branding.appendChild(avatarContainer);const titleDiv=this.createElement("div","branding-title");titleDiv.appendChild(document.createTextNode("Pana"));const aiBadge=this.createElement("span","branding-ai-badge");aiBadge.textContent="AI",titleDiv.appendChild(aiBadge),branding.appendChild(titleDiv);const desc=this.createElement("div","branding-description");desc.textContent="Pana - Trợ lý AI hỗ trợ bạn tra cứu thông tin và giải đáp mọi thắc mắc",branding.appendChild(desc),e.appendChild(t);const c=this.createElement("div","messages");c.appendChild(branding);const messagesContent=this.createElement("div","messages-content");this.getAttribute("history-enabled")!=="false"&&this.storage.getMessages().forEach(E=>this.renderMessage(E,messagesContent));c.appendChild(messagesContent);const g=this.createElement("div","input-area"),p=this.createElement("input");p.type="text",p.placeholder="Bạn cần hỗ trợ gì?";const f=this.createElement("button","",""),y=()=>{const d=p.value.trim();d&&(this.sendMessage(d),p.value="")};f.addEventListener("click",y),p.addEventListener("keypress",d=>{d.key==="Enter"&&!d.shiftKey&&(d.preventDefault(),y())}),g.appendChild(p),g.appendChild(f),e.appendChild(c),e.appendChild(g),this.shadow.innerHTML="",this.shadow.appendChild(e);const x=this.getAttribute("welcome-message");if(x&&!this.hasShownWelcomeMessage){const hasWelcomeInHistory=this.getAttribute("history-enabled")!=="false"&&this.storage.getMessages().some(msg=>msg.isWelcome===!0);if(!hasWelcomeInHistory&&this.isOpen){this.addWelcomeMessage(x),this.hasShownWelcomeMessage=!0}}}async sendMessage(e){const t=crypto.randomUUID(),s=new Date().toISOString(),i={id:t,text:e,sender:"user",timestamp:s,status:"sending"};this.storage.addMessage(i),this.renderMessage(i);this.showTypingIndicator();try{const l=await this.webhook.sendMessage({message:e,timestamp:s,sessionId:this.sessionId,context:{url:window.location.href},history:this.storage.getMessages().slice(-10)});this.hideTypingIndicator(),i.status="sent",this.storage.updateMessage(t,{status:"sent"});const c={id:crypto.randomUUID(),text:l.response,sender:"backend",timestamp:new Date().toISOString()};this.storage.addMessage(c),this.renderMessage(c)}catch(l){this.hideTypingIndicator(),l instanceof Error&&l.message==="Request cancelled"?(i.status="cancelled",this.storage.updateMessage(t,{status:"cancelled"})):(i.status="error",this.storage.updateMessage(t,{status:"error"}),this.addSystemMessage("Failed to send message. Please try again."))}}showTypingIndicator(){if(this.isTyping)return;this.isTyping=!0;const e=this.shadow.querySelector(".messages-content");if(!e)return;this.typingIndicator=this.createElement("div","typing-indicator");for(let t=0;t<3;t++){const s=this.createElement("div","typing-dot");this.typingIndicator.appendChild(s)}e.appendChild(this.typingIndicator);const messagesContainer=this.shadow.querySelector(".messages");messagesContainer&&(messagesContainer.scrollTop=messagesContainer.scrollHeight);this.brandingTypingBubble&&this.brandingTypingBubble.classList.add("show")}hideTypingIndicator(){if(!this.isTyping)return;this.isTyping=!1,this.typingIndicator&&(this.typingIndicator.remove(),this.typingIndicator=null),this.brandingTypingBubble&&this.brandingTypingBubble.classList.remove("show")}handleRefresh(){if(confirm("Bạn có muốn làm mới cuộc trò chuyện không?")){this.storage.clearHistory();const e=this.shadow.querySelector(".messages-content");e&&(e.innerHTML=""),this.hasShownWelcomeMessage=!1,this.hideTypingIndicator();const messagesContainer=this.shadow.querySelector(".messages");messagesContainer&&(messagesContainer.scrollTop=0),this.isOpen&&this.setOpen(!0)}}toggleExpand(){this.isExpanded=!this.isExpanded;const e=this.shadow.querySelector(".chat-window");e&&(this.isExpanded?e.classList.add("expanded"):e.classList.remove("expanded"));const t=this.shadow.querySelector(".header-actions button:nth-child(2)");t&&(t.innerHTML=this.isExpanded?'<svg class="header-icon" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>':'<svg class="header-icon" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',t.title=this.isExpanded?"Minimize":"Expand")}renderMessage(e,t){const s=t||this.shadow.querySelector(".messages-content");if(!s)return;const i=this.createElement("div",`message ${e.sender}`);i.dataset.messageId=e.id;if(e.sender==="backend"){const avatar=this.getAttribute("avatar");if(avatar){const avatarImg=document.createElement("img");avatarImg.className="message-avatar",avatarImg.src=avatar,avatarImg.alt="Assistant avatar",i.appendChild(avatarImg)}const contentDiv=this.createElement("div","message-content");const textSpan=this.createElement("span","message-text");textSpan.innerHTML=e.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),contentDiv.appendChild(textSpan),i.appendChild(contentDiv)}else{const textSpan=this.createElement("span","message-text");textSpan.textContent=e.text,i.appendChild(textSpan)}s.appendChild(i);const messagesContainer=this.shadow.querySelector(".messages");messagesContainer&&(messagesContainer.scrollTop=messagesContainer.scrollHeight)}clearHistory(){if(confirm("Are you sure you want to clear the chat history?")){this.storage.clearHistory();const e=this.shadow.querySelector(".messages-content");e&&(e.innerHTML=""),this.hasShownWelcomeMessage=!1;const messagesContainer=this.shadow.querySelector(".messages");messagesContainer&&(messagesContainer.scrollTop=0)}}addSystemMessage(e){const t={id:crypto.randomUUID(),text:e,sender:"system",timestamp:new Date().toISOString()};this.getAttribute("history-enabled")!=="false"&&this.storage.addMessage(t),this.renderMessage(t)}addWelcomeMessage(e){const t={id:crypto.randomUUID(),text:e,sender:"backend",timestamp:new Date().toISOString(),isWelcome:!0};this.getAttribute("history-enabled")!=="false"&&this.storage.addMessage(t),this.renderMessage(t)}close(){this.isOpen=!1,this.updateVisibility(),this.dispatchEvent(new CustomEvent("close"))}setOpen(e){if(this.isOpen=e,this.updateVisibility(),e&&!this.hasShownWelcomeMessage){const t=this.getAttribute("welcome-message");if(t){const hasWelcomeInHistory=this.getAttribute("history-enabled")!=="false"&&this.storage.getMessages().some(msg=>msg.isWelcome===!0);if(!hasWelcomeInHistory){this.addWelcomeMessage(t),this.hasShownWelcomeMessage=!0}}}}updateVisibility(){const e=this.shadow.querySelector(".chat-window");e&&(this.isOpen?e.classList.add("open"):e.classList.remove("open"))}attributeChangedCallback(e,t,s){if(t!==s){if(e==="webhook-url"){const i=s||"";this.storage=new m(i),this.webhook=new b(i)}this.render()}}}customElements.define("chat-window",C);class S extends a{constructor(){super();n(this,"styles",`
    :host {
      position: fixed;
      z-index: 9999;
      bottom: 20px;
      right: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    :host([position="bottom-left"]) {
      right: auto;
      left: 20px;
    }

    .chat-widget-container {
      --theme-color: ${this.getAttribute("theme-color")||"#132FBA"};
    }
  `);n(this,"window",null);this.addStyles(this.styles),this.render()}static get observedAttributes(){return["webhook-url","theme-color","position","title","welcome-message","history-enabled","history-clear-button","avatar"]}render(){this.shadow.innerHTML="";const e=this.createElement("div","chat-widget-container"),t=this.getConfig(),s=document.createElement("chat-window");s.setAttribute("webhook-url",t.webhookUrl),s.setAttribute("theme-color",t.themeColor),s.setAttribute("title",t.title),s.setAttribute("welcome-message",t.welcomeMessage),s.setAttribute("history-enabled",String(t.historyEnabled)),s.setAttribute("history-clear-button",String(t.historyClearButton)),s.setAttribute("position",t.position),t.avatar&&s.setAttribute("avatar",t.avatar),this.window=s;const i=document.createElement("chat-launcher");i.setAttribute("theme-color",t.themeColor),t.avatar&&i.setAttribute("avatar",t.avatar),i.addEventListener("toggleChat",l=>{const{isOpen:c}=l.detail;this.handleToggleChat(c)}),e.appendChild(s),e.appendChild(i),this.shadow.appendChild(e)}handleToggleChat(e){this.window&&this.window.setOpen(e)}getConfig(){return{webhookUrl:this.getAttribute("webhook-url")||"",themeColor:this.getAttribute("theme-color")||"#132FBA",position:this.getAttribute("position")||"bottom-right",title:this.getAttribute("title")||"Chat with us",welcomeMessage:this.getAttribute("welcome-message")||"",historyEnabled:this.getAttribute("history-enabled")!=="false",historyClearButton:this.getAttribute("history-clear-button")!=="false",avatar:this.getAttribute("avatar")||""}}attributeChangedCallback(e,t,s){t!==s&&(e==="theme-color"&&this.addStyles(`
          :host {
            position: fixed;
            z-index: 9999;
            bottom: 20px;
            right: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          :host([position="bottom-left"]) {
            right: auto;
            left: 20px;
          }

          .chat-widget-container {
            --theme-color: ${s||"#132FBA"};
          }
        `),this.render())}}customElements.define("chat-widget",S);function w(r){var e,t;const o=document.createElement("chat-widget");return o.setAttribute("webhook-url",r.webhookUrl),r.themeColor&&o.setAttribute("theme-color",r.themeColor),r.position&&o.setAttribute("position",r.position),r.title&&o.setAttribute("title",r.title),r.welcomeMessage&&o.setAttribute("welcome-message",r.welcomeMessage),r.avatar&&o.setAttribute("avatar",r.avatar),((e=r.history)==null?void 0:e.enabled)!==void 0&&o.setAttribute("history-enabled",String(r.history.enabled)),((t=r.history)==null?void 0:t.clearButton)!==void 0&&o.setAttribute("history-clear-button",String(r.history.clearButton)),document.body.appendChild(o),o}if(document.currentScript instanceof HTMLScriptElement){const r=document.currentScript;w({webhookUrl:r.dataset.webhookUrl||"",themeColor:r.dataset.themeColor,position:r.dataset.position,title:r.dataset.title,welcomeMessage:r.dataset.welcomeMessage,avatar:r.dataset.avatar||"",history:{enabled:r.dataset.historyEnabled!=="false",clearButton:r.dataset.historyClearButton!=="false"}})}h.initChatPopup=w,Object.defineProperty(h,Symbol.toStringTag,{value:"Module"})});