function setScrollspy(){
  $('.section').each(function() {
    var position = $(this).position();
    var offset = 10;
    //console.log(position);
    //console.log('min: ' + (position.top-offset) + ' / max: ' + parseInt(position.top + $(this).height()));
    $(this).scrollspy({
      min: (position.top-offset),
      max: position.top + $(this).height() -offset,
      onEnter: function(element) {
        var pageEl = $('.nav-'+element.id+' li');
        var fileEl = $('.nav-'+(element.id.slice(0, element.id.lastIndexOf('-')))+' li');
        // check for class rather than just toggle due to multiple scollspay targets
        if(!pageEl.hasClass('active')) {
          pageEl.addClass('active');
        }
        if(!fileEl.hasClass('active')) {
          fileEl.addClass('active');
        }
      },
      onLeave: function(element) {
        $('.nav-'+element.id+' li').removeClass('active');
        $('.nav-'+(element.id.slice(0, element.id.lastIndexOf('-')))+' li').removeClass('active');
      }
    });
  });
  // trigger highlighting
  $('body').scrollTop(1).scrollTop(0);
}

function toggleCode(){
  $('.ctrl-code').toggleClass('active');
  $('.dockit td:nth-child(2)').toggleClass('hidden');
  $(window).unbind('scroll');
  $('.menu li').removeClass('active');
  setScrollspy();
}

function toggleNav(){
  $('.nav').toggleClass('nav-hide');
  $('.ctrl-view-pages').toggleClass('ctrl-hide');
  $('.ctrl-view-files').toggleClass('ctrl-hide');
  $('.ctrl-all').toggleClass('ctrl-hide');
  $('.ctrl-nav').toggleClass('active');
  $('.docs').toggleClass('docs-full');
}

$(function() {
  var hash = window.location.hash;
  if(hash.indexOf('__file') !== -1){
    $('.ctrl-view-files').addClass('active');
    $('#pages').addClass('hidden');
    $('#files').removeClass('hidden');
    var pos = $('.nav-' + window.location.pathname.substring(1).slice(0, -5)).position().top - 200;
    $('.nav').scrollTop(pos);
  } else {
    $('.ctrl-view-pages').addClass('active');
  }
  if(hash.indexOf('__code') !== -1){
    toggleCode();
  }
  if(hash.indexOf('__menu') !== -1){
    toggleNav();
  }

  $('.ctrl-code').bind('click', toggleCode);
  $('.ctrl-nav').bind('click', toggleNav);

  $('.ctrl-view-pages').click(function() {
    $('.ctrl-view-pages').addClass('active');
    $('.ctrl-view-files').removeClass('active');
    $('#pages').removeClass('hidden');
    $('#files').addClass('hidden');
  });

  $('.ctrl-view-files').click(function() {
    $('.ctrl-view-files').addClass('active');
    $('.ctrl-view-pages').removeClass('active');
    $('#pages').addClass('hidden');
    $('#files').removeClass('hidden');
  });

  if(hash.indexOf('__code') === -1){
    setScrollspy();
  }
});
