// src/setupHistoryDebug.js
(() => {
  const p = history.pushState, r = history.replaceState;
  let n = 0;
  function log(kind, url){
    n++;
    // Comment the next line if it gets too chatty
    console.warn(`[${n}] ${kind}:`, url, "\n" + new Error().stack.split("\n").slice(2,8).join("\n"));
  }
  history.pushState = function(s,t,u){ log("pushState", u); return p.apply(this, arguments); };
  history.replaceState = function(s,t,u){ log("replaceState", u); return r.apply(this, arguments); };
})();
