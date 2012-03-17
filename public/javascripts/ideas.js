$(document).ready(function(){
  var loader = $('#loader')
    , form = $('#idea')
    , comment = $('#comment')
    , submit = $('#send')
    , description = $('[name="description"]')
    , createRoom = $('#create')
    , successIdea = '<p> You can see your idea at:<a href="<%= url%>",title="Go to"><%= url%></a></p>'
    , msg = $('#msg')
    ;
    $('[type="text"]').val('');
    description.val('');
    $('[rel~="facebox"]').facebox();
    window.oldAlert = window.alert;
    window.alert = function(str){
      jQuery.facebox(str);
    }
    createRoom.on('click', function(e){
      e.preventDefault()
      jQuery.facebox(newRoom);
      description.val('')
    })
    
    submit.on('click', function(e){
      e.preventDefault();
      loader.removeClass('off')
      msg.textContent = 'Posting...'
      form.addClass('off')
      var action ='new'
      if (window.location.pathname.search('/create')!==-1) action = 'create'
      var data = serialize(action);
      $.post('/'+data.room + '/'+action,data,function(resp,status){
        if (resp && status == 'success'){
          var self = resp;
          switch (resp.statusCode){
            case 200:
            case '200':
              var tpl = _.template(successIdea)
              comment.html(tpl({url:resp.url}));
              break;
            case '422':
            case 422:
              var msg = resp.msg ? resp.msg:'Idea name already Exists'
              comment.html('<div class="center"><h4> Error</h4><span> '+msg+'</span></div>')
              break;
            default:
              comment.html('<div class="center"><h4> 500 Internal Server Error</h4><span> Try again in a little</span></div>')
              break;
          }
        }
      });
    });
    function getValues (name){
      return $('[name="'+name+'"]')
    }
    window.serialize = function(action){
      var serial = {
          name: getValues('name').val()
        , description : getValues('description').val()
        , author:{
              name: getValues('user[name]').val()
            , from : getValues('user[from]').val()
            , email: getValues('user[email]').val()
          }
        , room : getValues('user[from]').val()
      }
      switch (action){
        case "create":
            serial.author.password =getValues('user[password]').val()
            return serial;
          break;
        default:
          return serial;
        break;
      }
    }
  var newRoom ='\
  <section id="form" class="five columns centered" style="margin-left:10px;margin-right:10px">\
      <img src="/assets/images/loading.gif" id="loader" class="off"><br>\
      <h4 id="msg">Add your awesome room  \
      </h4><br>\
      <form action="/ideasBoxs/create" method="POST" id="sendBox" class="nice" style="margin-left:0">\
        <input type="text" name="name" placeholder="the name of your room" required="required" class="input-text">\
        <textarea name="description" placeholder="tell us more about your room" cols="30" rows="5" required="required"></textarea>\
        <input type="text" name="user[name]" placeholder="your name" required="required" class="input-text">\
        <input type="text" name="user[email]" placeholder="your email (we won\'t store it) just for the avatar" required="required" class="input-text">\
        <input type="password" name="user[password]" placeholder="add your secret p4ssw0r2 (this is not recovered)" class="input-text">\
        <input type="hidden" name="user[from]" value="ideasBoxs">\
        <input type="submit" value="add new Room" id="send" class="button black radius">\
      </form>\
    </section>'
})