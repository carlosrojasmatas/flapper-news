var app = angular.module('flapperNews', ['ui.router']);

app.controller('MainCtrl', [
'$scope',
 'posts',
function($scope,posts){

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
}]);

app.controller('PostsController',[
'$scope',
'posts',
'post',
function($scope,posts,post){
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
}]);

app.factory('posts',['$http',function($http){

	var obj = {
		posts: []
	};

	obj.getAll= function(){
		return $http.get('/posts').success(function(data){
			angular.copy(data,obj.posts);
		});
	};

	obj.create = function(post){
		return $http.post('/posts',post).success(function(data){
			obj.posts.push(data);
		});
	}

	obj.upvote = function(post){
		return $http.put('/posts/' + post._id + '/upvote')
				.success(function(data){
					post.upvotes +=1;
				});
	}

	obj.get=  function(id){
		return $http.get('/posts/' + id).then(function(res){
			return res.data;
		});
	}

	obj.addComment= function (id,comment){
		return $http.post('/posts/' + id + '/comments',comment);
	}

	obj.upvoteComment= function(post,comment){
		return $http.put('/posts/'+post._id + '/comments/' + comment._id + '/upvote')
				.success(function(data){
					comment.upvotes += 1;
				});
	};


	return obj;

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
	$urlRouterProvider.otherwise('home');
}]);