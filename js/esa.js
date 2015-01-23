
var ESA = function(config){

  this.config = $.extend({}, {
    velocity : 2.8,
    wrapper  : null,
    selector : '#esa',
    timer: {
      resizing: 600,
      ignoring: 3000
    },
    hook: {
      before_move: null,
      while_move: null,
      after_move: null
    }
  }, config || {});


  this.state = {
    moving: false,
    defaults: {
      top: 0,
      left: 0
    }
  };


  this.init = function(){
    this.$el = $(this.config.selector);
    if(!this.$el || !this.$el.length) return;
  }

  this.hook = function(name, clb){
    var callback = function(){};
    var df = {run: function(){}};

    if(!this.config.hook.hasOwnProperty(name))
      return df;

    if(name && typeof clb == 'function'){
      this.config.hook[name] = clb;
      callback = clb;
    }else if(name && typeof this.config.hook[name] == 'function'){
      callback = this.config.hook[name];
    }

    df.run = (function(c){return function(){callback.call(c,arguments);}})(this);
    return df;
  }


  this.play = function(){
    this.state.moving = false;
  }


  this.pause = function(){
    this.state.moving = true;
  }


  this.trap = function(){
    this.init();
    this.init_position();
    this.$el.fadeTo('fast', 1);

    $(window).on('resize', $.proxy(observe_window_resize, this));

    this.$el.on('mouseover click', $.proxy(observe_catching_esa, this));

    return this;
  }


  this.reposition = function(){
    this.pause();
    this.move(
      this.state.defaults.left,
      this.state.defaults.top,
      preserve_state_change.apply(this, ['moving', false])
    );
  }


  this.move = function(x,y,c,d){
    var self = this;
    var cnf = self.config;
    self.hook('before_move').run.call(self, arguments);
    self.$el.animate({
      top: y,
      left: x
    }, {
      step: function(s){
        self.hook('while_move').run.call(self, s);
      },
      complete: function(){
        self.hook('after_move').run.call(self);
        c();
      },
      duration: d || 'fast'
    });
  }


  this.init_position = function(anim){
    var sz = fetch_size(this.$el);
    var pr = this.config.wrapper ? $(this.config.wrapper) : this.$el.parent();
    var wh = pr.height();
    var wt = pr.offset().top;
    var ww = pr.width();
    var wl = pr.offset().left;

    this.state.defaults.top = (wh - sz[1])/2+wt;
    this.state.defaults.left = (ww - sz[0])/2+wl;

    var pr = {
      top:  this.state.defaults.top,
      left: this.state.defaults.left
    }

    if(anim){
      this.pause();
      this.move(pr.left, pr.top, $.proxy(this.play, this));
    }else{
      this.$el.css({
        'position': 'absolute'
      });
      this.$el.css(pr);
    }

  }




  // Privates


  function observe_window_resize(){
    monitor(wsize(), this.config.timer.resizing, function(v){
      return v.toString() == wsize().toString();
    })($.proxy(function(){
      this.init_position(true);
    }, this));
  }


  function observe_ignoring_esa(){
    var el = this.$el;
    this.play();
    monitor(calc_center(el), this.config.timer.ignoring, function(v){
      return v.toString() == calc_center(el).toString();
    })($.proxy(this.reposition, this));
  }


  function observe_catching_esa(e){

    if(this.state.moving) return;

    this.pause();

    var vc = calc_vector(this.$el, e);
    var vl = calc_velocity(vc, this.config.velocity);

    this.move( vl[0], vl[1],
      $.proxy(observe_ignoring_esa, this), 200
    );
  }


  function monitor(tgt, tm, vld){
    return function(clb, err){
      setTimeout(function(){
        (vld(tgt))
          ? (typeof clb === 'function' && clb(tgt))
          : (typeof err === 'function' && err(tgt));
      }, tm);
    }
  }


  function preserve_state_change(n, v){
    if(this.state.hasOwnProperty(n)){
      return (function(c){
        return function(){
          c.state[n] = v;
        }
      })(this);
    }
  }


  function calc_velocity(vc, vlc){
    return [
      (vc[0] > 0 ? '+' : '-')+'=' + (Math.abs(vc[0])*vlc),
      (vc[1] > 0 ? '+' : '-')+'=' + (Math.abs(vc[1])*vlc)
    ];
  }


  function fetch_size(el){
    return [el.width(), el.height()];
  }


  function calc_vector(el, e){
    var cnt = calc_center(el);
    var mos = [e.clientX, e.clientY + $(window).scrollTop()];

    var cx = e.clientX;
    var cy = e.clientY;

    return [(cnt[0] - mos[0]), (cnt[1] - mos[1])];
  }


  function calc_center(el){
    var sz  = fetch_size(el);
    var eof = el.offset();
    return [(eof.left+(sz[0]/2)), (eof.top+(sz[1]/2))];
  }


  function wsize(){
    return [$(window).width(), $(window).height()];
  }

}
