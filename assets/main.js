function setScrollspy(){
  $('.section').each(function() {
    var position = $(this).position();
    var offset = 10;
    // if($(this).hasClass('md')){
    //   offset = 0;
    // }
    //console.log(position);
    //console.log('min: ' + (position.top-offset) + ' / max: ' + parseInt(position.top + $(this).height()));
    $(this).scrollspy({
      min: (position.top-offset),
      max: position.top + $(this).height() -offset,
      onEnter: function(element, position) {
        //console.log('.nav-'+element.id+' li');
        //console.log('.nav-'+(element.id.slice(0, element.id.lastIndexOf('-')))+' li')
        $('.nav-'+element.id+' li').toggleClass('active');
        $('.nav-'+(element.id.slice(0, element.id.lastIndexOf('-')))+' li').toggleClass('active');
      },
      onLeave: function(element, position) {
        $('.nav-'+element.id+' li').toggleClass('active');
        $('.nav-'+(element.id.slice(0, element.id.lastIndexOf('-')))+' li').toggleClass('active');
      }
    });
  });
  // trigger the highlighting
  $('body').scrollTop(1);
  $('body').scrollTop(0);
}

$(document).ready(function() {

  $('#ctrl-code').bind('click', function() {
    $('#dockit td:nth-child(2)').toggleClass('hidden');
    $(window).unbind('scroll');
    $('.menu li').removeClass('active');
    setScrollspy();
  });

  $('#ctrl-view-pages').bind('click', function() {
    $('#ctrl-view-pages').addClass('active');
    $('#ctrl-view-files').removeClass('active');
    $('#pages').toggleClass('hidden');
    $('#files').toggleClass('hidden');
  });

  $('#ctrl-view-files').bind('click', function() {
    $('#ctrl-view-files').addClass('active');
    $('#ctrl-view-pages').removeClass('active');
    $('#pages').toggleClass('hidden');
    $('#files').toggleClass('hidden');
  });


  $('#ctrl-view').bind('click', function() {
    if($('#ctrl-view')[0].innerText == 'files'){
      $('#ctrl-view')[0].innerText = 'pages';
    } else {
      $('#ctrl-view')[0].innerText = 'files';
    }
    $('#pages').toggleClass('hidden');
    $('#files').toggleClass('hidden');
  });

  $('.ctrl-nav').bind('click', function() {
    $('#nav').toggleClass('hidden');
    $('.ctrl-nav').toggleClass('ctrl-nav-closed');
    $('.docs').toggleClass('docs-full');
  });

  // equalize the divs
  //$('.section').equalize('height');
  setScrollspy();
});