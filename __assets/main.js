(function(){

  // set scrollspy points
  function setScrollspy(){
    $('.section').each(function() {
      var position = $(this).position(),
          offset = 10;
      //console.log(position);
      //console.log('min: ' + (position.top-offset) + ' / max: ' + parseInt(position.top + $(this).height()));
      $(this).scrollspy({
        min: (position.top-offset),
        max: position.top + $(this).height() -offset,
        onEnter: function(element) {
          // page highlight
          var pageEl = $('.nav-'+element.id+' li');
          // file highlight
          var fileEl = $('.nav-'+(element.id.slice(0, element.id.lastIndexOf('-')))+' li');
          // check for class rather than just toggle due to multiple scollspy targets
          if(!pageEl.hasClass('active')) {
            pageEl.addClass('active');
          }
          if(!fileEl.hasClass('active')) {
            fileEl.addClass('active');
          }
        },
        onLeave: function(element) {
          // page highlight
          $('.nav-'+element.id+' li').removeClass('active');
          // file highlight
          $('.nav-'+(element.id.slice(0, element.id.lastIndexOf('-')))+' li').removeClass('active');
        }
      });
    });
    // trigger highlighting
    $('body').scrollTop(1).scrollTop(0);
  }

  var nav, ctrlPages, ctrlFiles, ctrlAll, ctrlNav, ctrlCode, docs;

  function toggleCode(){
    ctrlCode.toggleClass('active');
    $('.dockit td:nth-child(2)').toggleClass('hidden');
    $(window).unbind('scroll');
    $('.menu li').removeClass('active');
    // recalculate scrollspy as positions have changed
    setScrollspy();
  }

  function toggleNav(){
    nav.toggleClass('nav-hide');
    ctrlPages.toggleClass('ctrl-hide');
    ctrlFiles.toggleClass('ctrl-hide');
    ctrlAll.toggleClass('ctrl-hide');
    ctrlNav.toggleClass('active');
    docs.toggleClass('docs-full');
  }

  function toggleTransformer() {
    nav.toggleClass('transformer');
    ctrlPages.toggleClass('transformer');
    ctrlFiles.toggleClass('transformer');
    ctrlAll.toggleClass('transformer');
    ctrlNav.toggleClass('transformer');
    docs.toggleClass('transformer');
  }

  $(function() {

    nav = $('.nav');
    ctrlPages = $('.ctrl-pages');
    ctrlFiles = $('.ctrl-files');
    ctrlAll = $('.ctrl-all');
    ctrlNav = $('.ctrl-nav');
    ctrlCode = $('.ctrl-code');
    docs = $('.docs');
    pages = $('#pages');
    files = $('#files');

    var hash = window.location.hash;
    if(hash.indexOf('__file') !== -1){
      // showing a file
      ctrlFiles.addClass('active');
      pages.addClass('hidden');
      files.removeClass('hidden');
      // ensure nav is scrolled to the file being shown
      var split = window.location.pathname.split('/');
      nav.scrollTop(($('.nav-' + split[(split.length - 1)].slice(0, -5))).position().top - 200);
    } else {
      // showing a page
      ctrlPages.addClass('active');
    }
    // support hiding code on page load
    if(hash.indexOf('__code') !== -1){
      toggleCode();
    }
    // support hiding menu on page load
    if(hash.indexOf('__menu') !== -1){
      toggleTransformer();
      toggleNav();
      setTimeout(function(){
        toggleTransformer();
      }, 0);
    }

    ctrlCode.click(toggleCode);
    ctrlNav.click(toggleNav);
    ctrlPages.click(function() {
      ctrlPages.addClass('active');
      ctrlFiles.removeClass('active');
      pages.removeClass('hidden');
      files.addClass('hidden');
    });
    ctrlFiles.click(function() {
      ctrlFiles.addClass('active');
      ctrlPages.removeClass('active');
      pages.addClass('hidden');
      files.removeClass('hidden');
    });

    if(hash.indexOf('__code') === -1){
      setScrollspy();
    }
  });

})();
