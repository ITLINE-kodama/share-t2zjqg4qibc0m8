(function(){
  'use strict';
  var groups=[].slice.call(document.querySelectorAll('.has-mega'));
  var file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  var currentFile=file==='news-detail.html'?'news.html':file;
  function close(group,focusToggle){
    group.classList.remove('open');
    var t=group.querySelector('.mega-toggle');
    if(t)t.setAttribute('aria-expanded','false');
    if(focusToggle&&t)t.focus();
  }
  groups.forEach(function(group){
    var toggle=group.querySelector('.mega-toggle');
    var top=group.querySelector('.gnav-top');
    var links=[].slice.call(group.querySelectorAll('.mega-links a'));
    var current=links.find(function(a){return (a.getAttribute('href')||'').split('#')[0].toLowerCase()===currentFile});
    if(current){current.setAttribute('aria-current','page');group.classList.add('is-current')}
    if(toggle){toggle.addEventListener('click',function(e){e.preventDefault();var opening=!group.classList.contains('open');groups.forEach(function(g){if(g!==group)close(g)});group.classList.toggle('open',opening);toggle.setAttribute('aria-expanded',opening?'true':'false')})}
    if(top){top.addEventListener('keydown',function(e){if(e.key==='ArrowDown'&&links.length){e.preventDefault();groups.forEach(function(g){if(g!==group)close(g)});group.classList.add('open');if(toggle)toggle.setAttribute('aria-expanded','true');links[0].focus()}})}
    group.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();close(group,true)}});
  });
  [].slice.call(document.querySelectorAll('.gnav-direct .gnav-top')).forEach(function(link){
    if((link.getAttribute('href')||'').split('#')[0].toLowerCase()===currentFile){link.setAttribute('aria-current','page')}
  });
  document.addEventListener('click',function(e){groups.forEach(function(group){if(!group.contains(e.target))close(group)})});
})();
