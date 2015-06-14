(function(window, undefined){
    'use strict';
    var imgs = [],
        els = [];

    function imageViwer(el){
        var basePath = el.getAttribute('data-base-path') || 'images/',
            images = el.getAttribute('data-images').split(','),
            delay = el.getAttribute('data-delay') || 500,
            bp = '',
            visibleClasses = 'imageviewer-img imageviewer-img-visible',
            hiddenClasses = 'imageviewer-img imageviewer-img-hidden',
            transitionState,
            transitionEvent,
            index;

        function getTransitionedEvent(){
            var transitions = {
                    'WebkitTransition' :'webkitTransitionEnd',
                    'MozTransition'    :'transitionend',
                    'MSTransition'     :'msTransitionEnd',
                    'OTransition'      :'oTransitionEnd',
                    'transition'       :'transitionEnd'
                };
            function parse(){
                for(var t in transitions){
                    if( el.style[t] !== undefined ){
                      transitionEvent = transitions[t];
                      return transitionEvent;
                    }
                }
            }
            return transitionEvent || parse();
        }

        function yieldAndThen(fn, miliseconds){
            setTimeout(function(){
                fn();
            }, miliseconds === undefined ? delay : miliseconds);
        }

        function transitioned(){
            el.addEventListener(transitionEvent, transitioned, false);
            switch (transitionState) {
                case 'visible':
                    // el.setAttribute('class', hiddenClasses);
                    yieldAndThen(function(){
                        el.setAttribute('class', hiddenClasses);
                        transitionState = 'hidden';
                    });
                    break;
                case 'hidden':
                    // el.setAttribute('class', visibleClasses);
                    yieldAndThen(function(){
                        index += 1;
                        index = index > images.length - 1 ? 0 : index;
                        el.setAttribute('src', images[index]);
                        el.setAttribute('class', visibleClasses);
                        transitionState = 'visible';
                    }, 0);
                    break;
            }
        }

        bp = basePath[basePath.length - 1];
        bp = bp === '/' ? basePath : basePath + '/';

        //Add basepath to each image
        images = images.map(function(i){
            var img = i.trim();
            return bp + img;
        })  ;

        //add handler for the transitioned event
        el.addEventListener(getTransitionedEvent(), transitioned, false);

        //Show the 1st image
        index = 0;
        el.setAttribute('src', images[index]);
        transitionState = 'hidden';
        yieldAndThen(function(){
            el.setAttribute('class', hiddenClasses);
        });

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
