var app = angular.module('flapperNews', ['ui.router']);

app.controller('MainCtrl', [
'$scope',
 'posts',
 'auth',
function($scope,posts,auth){

  $scope.posts = posts.posts;
  $scope.addPost=function(){
  	if(!$scope.title || $scope.title === '') { return;}
  	posts.create({
  		title: $scope.title,
  		link: $scope.link
  	});
  	$scope.title="";
  	$scope.link = '';
  }

  $scope.incrementUpVotes=function(post){
  	posts.upvote(post);
  }

  $scope.isLoggedIn = auth.isLoggedIn();
}]);

app.controller('PostsController',[
'$scope',
'posts',
'post',
'auth',
function($scope,posts,post,auth){
	$scope.post=post;

	$scope.addComment = function(){
		if($scope.body === ''){return;}
		posts.addComment(post._id, {
			body:$scope.body,
			autor:'user'
		}).success(function(comment){
			$scope.post.comments.push(comment);
		});

		$scope.body = '';
	}

	$scope.incrementUpVotes= function(post,comment) {
		posts.upvoteComment(post,comment);
	}

	$scope.isLoggedIn = auth.isLoggedIn();
}]);

app.controller('AuthCtrl',[
	'$scope',
	'$state',
	'auth',
	function($scope,$state,auth){

		$scope.user = {};

		$scope.register = function(){
			auth.register($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home')
			});
		}

		$scope.logIn = function(){
			auth.logIn($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		}
	}
]);

app.controller('NavController',[
	'$scope',
	'auth',
	function($scope,auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
	}

]);

app.factory('posts',['$http', 'auth',function($http, auth){

	var obj = {
		posts: []
	};

	obj.getAll= function(){
		return $http.get('/posts').success(function(data){
			angular.copy(data,obj.posts);
		});
	};

	obj.create = function(post){
		return $http.post('/posts',post,{
			header: {Authorization:'Bearer '+ auth.getToken()}
		}).success(function(data){
			obj.posts.push(data);
		});
	}

	obj.upvote = function(post){
		return $http.put('/posts/' + post._id + '/upvote',null, {
			header: {Authorization:'Bearer '+ auth.getToken()}
		}).success(function(data){
					post.upvotes +=1;
				});
	}

	obj.get=  function(id){
		return $http.get('/posts/' + id).then(function(res){
			return res.data;
		});
	}

	obj.addComment= function (id,comment){
		return $http.post('/posts/' + id + '/comments',comment,{
			header: {Authorization:'Bearer '+ auth.getToken()}
		});
	}

	obj.upvoteComment= function(post,comment){
		return $http.put('/posts/'+post._id + '/comments/' + comment._id + '/upvote',{
			header: {Authorization:'Bearer '+ auth.getToken()}
		}).success(function(data){
					comment.upvotes += 1;
				});
	};


	return obj;

}]);

app.factory('auth',['$http','$window', function($http,$window){
	var auth = {};

	auth.saveToken = function(token){
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['flapper-news-token'];
	}

	auth.isLoggedIn = function(){
		var token = auth.getToken();
		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		}else{
			return false;
		}
	};

	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user){
		return $http.post('/register',user).success(function(data){
			auth.saveToken(data.token);
		})
	}

	auth.logIn = function(user){
		return $http.post('/login',user).success(function(data){
			auth.saveToken(data.token);
		});
	}

	auth.logOut = function(){
		$window.localStorage.removeItem('flapper-news-token');
	}


	return auth;
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider,$urlRouterProvider) {
	$stateProvider
		.state('home',{
			url: '/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
			resolve: {
				postPromise:['posts', function(posts){
					return posts.getAll();
				}]
			}
		});

	$stateProvider.state('posts',{
		url:'/posts/{id}',
		templateUrl: '/posts.html',
		controller: 'PostsController',
		resolve: {
			post:['$stateParams','posts',function($stateParams,posts){
				return posts.get($stateParams.id);
			}]
		}
	});	

	$stateProvider.state('login',{
		url: '/login',
		templateUrl: '/login.html',
		controller : 'AuthCtrl',
		onEnter: ['$state','auth', function($state,auth){
			if(auth.isLoggedIn()){
				$state.go('home')
			}
		}]
	});

	$stateProvider.state('register',{
		url: '/register',
		templateUrl: '/register.html',
		controller: 'AuthCtrl',
		onEnter: ['$state','auth',function($state, auth){
			if(auth.isLoggedIn()){
				$state.go('home');
			}
		}]
	});

	$urlRouterProvider.otherwise('home');

}]);