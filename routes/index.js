var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret:'SECRET', userProperty:'payload'});


router.param('post',function(req,res,next,id){
	var query = Post.findById(id);

	query.exec(function(err,post){
		if(err) { return next(err);}

		if(!post){ return next(new Error('can\'t find post'));}

		req.post = post;

		return next();
	});

})

router.param('comment',function(req,res,next,id){
	var query = Comment.findById(id);

	query.exec(function(err,cmm){
		if(err){ return next(err); }

		if(!cmm) {return next(new Error('can\t find comment')); }

		req.comment = cmm;
		return next();
	});
});

router.get('/posts',function(req,res,next){
	Post.find(function(err,posts){
		if(err){ return next(err);}

		res.json(posts);
	});
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/posts/:post',function(req,res){
	req.post.populate('comments', function(err,post){
		if(err) {return next(err); }
		res.json(req.post);
	});
});

router.post('/posts',auth,function(req,res,next){
	var post = new Post(req.body);
	post.autor = req.payload.username;
	post.save(function(error,post){
		if(error) { return next(err);}
		res.json(post);
	});
});

router.put('/posts/:post/upvote', auth, function(req,res,next){
	req.post.upvote(function(err,post){
		if(err){ return next(err); }

		res.json(post);
	});
})

router.put('/posts/:post/comments/:comment/upvote',auth, function(req,res,next){

	req.comment.upvote(function(err,comment){
		if(err) { return next(err);}

		res.json(comment);
	});
});

router.post('/posts/:post/comments',auth, function(req,res,next){
	var comment = new Comment(req.body);
	comment.post = req.post;
	comment.author = req.payload.username;
	comment.save(function(err,comment){
		if(err) { return next(err);}

		req.post.comments.push(comment);
		req.post.save(function(err,post){
			if(err) {return next(err);}

			res.json(comment);
		});
	});
})

router.post('/register', function(req,res,next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	var user = new User();
	user.username=  req.body.username;
	user.setPassword(req.body.password);

	user.save(function(err){
		if(err){return next(err);}

		return res.json({token: user.generateJWT()});
	});
});


router.post('/login', function(req,res,next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	passport.authenticate('local', function(err,user,info){
		if(err){ return next(err);}

		if(user){
			return res.json({token: user.generateJWT()});
		}else{
			return res.status(401).json(info);
		}
	})(req,res,next);

})


module.exports = router;
