$(document).ready(function(){
  var loader = $('#loader')
    , form = $('#idea')
    , comment = $('#comment')
    , submit = $('#send')
    , successIdea = '<p> You can see your idea at:<a href="<%= url%>",title="Go to"><%= url%></a></p>'
    , msg = $('#msg')
    ;

    submit.on('click', function(e){
      e.preventDefault();
      loader.removeClass('off')
      msg.textContent = 'Posting...'
      form.addClass('off')
      var data = serialize()
      $.post('/'+data.room + '/new',data,function(resp,status){
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
    window.serialize = function(){
      return {
          name: getValues('name').val()
        , description : getValues('description').val()
        , author:{
              name: getValues('user[name]').val()
            , from : getValues('user[from]').val()
            , email: getValues('user[email]').val()
          }
        , room : getValues('user[from]').val()
      }
    }

})