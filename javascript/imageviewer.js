(function(window, undefined){
    'use strict';
    var imgs = [],
        els = [];

    function imageViwer(el){
        var basePath = el.getAttribute('data-base-path') || 'images/',
            images = el.getAttribute('data-images').split(','),
            delay = el.getAttribute('data-delay') || 500,
            bp = '',
            index;

        function addStylesToEl(el, elStyles){
            var st = el.style;
            elStyles.forEach(function(style){
                st[style[0]] = style[1];
            });
        }

        function fadeIn(){
            var opacity = 0,
                tid;
            el.setAttribute('src', images[index]);
            tid = setInterval(function(){
                opacity += 0.01;
                addStylesToEl(el, [['opacity', opacity]]);
                if(opacity >= 1){
                    clearInterval(tid);
                    pause(el);
                }
            }, 10);
        }

        function pause(){
           setTimeout(function(){
              fadeOut(el);
           }, delay);
        }

        function fadeOut(){
            var opacity = 1,
                tid;
            tid = setInterval(function(){
                opacity -= 0.01;
                addStylesToEl(el, [['opacity', opacity]]);
                if(opacity <= 0){
                    clearInterval(tid);
                    index += 1;
                    index = index > images.length - 1 ? 0 : index;
                    fadeIn(el);
                }
            }, 10);
        }

        bp = basePath[basePath.length - 1];
        bp = bp === '/' ? basePath : basePath + '/';

        //Add basepath to each image
        images = images.map(function(i){
            var img = i.trim();
            return bp + img;
        })  ;

        //Show the 1st image
        index = 0;
        el.setAttribute('src', images[index]);

        //... and pause
        setTimeout(function(){
            pause();
        }, 1);

    }

    //Get all images elements
    imgs = document.getElementsByTagName('img');
    imgs = [].slice.call(imgs, 0);
    //Filter for intended image viewers
    els = imgs.filter(function(img){
        return !!img.getAttribute('data-image-viewer');
    });
    //Turn them into image viewers
    els.forEach(function(img){
        imageViwer(img);
    });
}(window));
