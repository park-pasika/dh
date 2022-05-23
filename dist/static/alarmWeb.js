var dhWeb = new DHAlarmWeb();
var subIframeWins = [];
;!function(){
	  var layer = layui.layer
	  ,form = layui.form
	  ,slider = layui.slider;

	//页面加载时判断左侧菜单是否显示
	//通过顶部菜单获取左侧菜单
	$(".topLevelMenus li,.mobileTopLevelMenus dd").click(function(){
		if($(this).parents(".mobileTopLevelMenus").length != "0"){
			$(".topLevelMenus li").eq($(this).index()).addClass("layui-this").siblings().removeClass("layui-this");
		}else{
			$(".mobileTopLevelMenus dd").eq($(this).index()).addClass("layui-this").siblings().removeClass("layui-this");
		}
		$(".layui-layout-admin").removeClass("showMenu");
        // $("body").addClass("site-mobile");
		var menu = $(this).data("menu");
		if(menu == "broadcast"){
			openRealtimeBC();
		}else if(menu == "timerBroadcast"){
			openTimerBC();
		}else if(menu == "qrCodeIssued"){
			openQrCode();
		}else if(menu == "mediaSource"){
			openMediaSource();
		}

	});
	//隐藏左侧导航
	$(".hideMenu").click(function(){
		if($(".topLevelMenus li.layui-this a").data("url")){
			layer.msg("此栏目状态下左侧菜单不可展开");  //主要为了避免左侧显示的内容与顶部菜单不匹配
			return false;
		}
		$(".layui-layout-admin").toggleClass("showMenu");
	})

	layer.config({
		extend: 'myskin/style.css' //同样需要加载新皮肤
	});

	//手机设备的简单适配
    $('.site-tree-mobile').on('click', function(){
		$('body').addClass('site-mobile');
	});
    $('.site-mobile-shade').on('click', function(){
		$('body').removeClass('site-mobile');
	});
	$(".notice").click(function(){
		// $(".layui-side-right").css("right", "0");
		layer.open({
		  type: 1,
		  title: "待处理列表",
		  skin: ['layer-ext-myskin'],
		    // skin: 'layui-layer-nobg layer_bg',
		  offset: "rb",
		  area:["300px", "calc(100% - 50px)"],
		  shade: 0.1,
		  shadeClose: true,
		  content: "<div class='noticeLayer'>"+$(".noticeContent").html()+"</div>"
		});
	  });
	//关闭所有视频
	$(".closeAll").click(function(){
	   for(var i=0;i<$('video').length;i++){
			var id = $("video")[i].id;
			var deviceId = id.split("_")[1];
			dhWeb.stopRT(deviceId,sessionStorage.getItem('loginHandle'));
		}
		$(".playDiv").removeClass("anim-scaleSpring").addClass("anim-fadeout");
		setTimeout(function(){
			$(".playDiv").remove()
			$(".closeAll").hide();;
			setVideoSize();
		},1000);
	});
  $(".layui-side-right").click(function(){
	//$(".layui-side-right").css("right", "-260px");
  });


	var touchtime = new Date().getTime();
	var touchElement = "";

	//呼叫列表双击（兼容移动端没有dblclick）
    $(document).on("click", ".li_notify", function(){
		if( new Date().getTime() - touchtime < 500 && touchElement === this){
            var deviceId= $(this).attr("deviceid");
			playVideo(deviceId, true);
			layer.closeAll("page");
        }else{
            touchtime = new Date().getTime();
			touchElement = this;
        }
	});
	//设备列表双击
	$(document).on('click', '.deviceLi', function() {
		if( new Date().getTime() - touchtime < 500 && touchElement === this){
            var deviceStatus = $(this).attr("deviceStatus");
			var deviceId = $(this).attr("deviceid");
			if(deviceStatus == "Offline"){
				layer.msg("设备离线，无法观看");
				return;
			}
			if(deviceStatus == "Dealing"){
				layer.msg("正在处理中，无法观看");
				return;
			}
			var callStaus = deviceStatus == "Start" ? true : false;
			playVideo(deviceId, callStaus);
        }else{
            touchtime = new Date().getTime();
			touchElement = this;
        }
	});
	//视频双击全屏
	$(document).on('click', '.videoboxDiv', function() {
		if(new Date().getTime() - touchtime < 500 && touchElement === this){
            launchFullscreen($(this).parent(".playDiv")[0]);
        }else{
            touchtime = new Date().getTime();
			touchElement = this;
        }
	});

	//播放视频
	function playVideo(deviceId, callStatus){
		removeMusic();
		var deviceType = $(".deviceLi[deviceid="+deviceId+"]").attr("devicetype");
		console.log("设备类型"+deviceType);
		var opeHtml = "";
		if(deviceType == "Alarm"){
			opeHtml = '<div class="operateDiv">'+
						'<button class="talk" title="对讲"></button>'+
						'<button class="unlock" title="开闸"></button>'+
						'<button class="locked" title="关闸"></button>'+
						'<button class="close" title="关闭"></button>'+
						'<button class="setting" title="设置" style="float: right;"></button>'+
					'</div>';
		}else{
			opeHtml = '<div class="operateDiv">'+
						'<button class="close" title="关闭"></button>'+
					'</div>';
		}
		var html = '<div class="playDiv anim-scaleSpring" deviceid="'+deviceId+'">'+
						'<div class="videoboxDiv">'+
							'<video id="play_'+deviceId+'"></video><span>'+$(".deviceLi[deviceid='"+deviceId+"'] .deviceName").text()+'</span>'+
							'<img class="loading" src="images/loading.gif"/><img style="display:none;" class="micImg" src="./images/micmute.png"/>'+
						'</div>'+ opeHtml+
					'</div>';
		if(!$("#play_"+deviceId)[0]) $(".mainContent").append(html);
		if(callStatus) $(".playDiv[deviceid="+deviceId+"] .talk").addClass("talking");
		selectVideo($(".playDiv[deviceid="+deviceId+"] .videoboxDiv")); //选中该设备
		dhWeb.playDeviceAudio(deviceId);

		dhWeb.playRT($('#play_'+deviceId)[0],deviceId,sessionStorage.getItem('loginHandle'),callStatus);
		if(callStatus){
			 //播放联动设备
			var parentId = $(".deviceLi[deviceid="+deviceId+"]").attr('parentId');
			var groupDevices = $('li[parentId = '+parentId+']');
			for(var i =0; i<groupDevices.length;i++){
				var deviceId = $(groupDevices[i]).attr("deviceid");
				if($('#play_'+deviceId)[0]) continue;
				var deviceType = $(groupDevices[i]).attr("devicetype");
				var deviceStatus = $(groupDevices[i]).attr("devicestatus");
				if(deviceType == 'Alarm') continue;
				if(deviceStatus== 'Offline') continue;
				var html = '<div class="playDiv anim-scaleSpring" deviceid="'+deviceId+'">'+
								'<div class="videoboxDiv">'+
									'<video id="play_'+deviceId+'"></video><span>'+$(".deviceLi[deviceid='"+deviceId+"'] .deviceName").text()+'</span>'+
									'<img class="loading" src="images/loading.gif"/><img style="display:none;" class="micImg" src="./images/micmute.png"/>'+
								'</div>'+
								'<div class="operateDiv">'+
									'<button class="close" title="关闭"></button>'+
								'</div>'+
							'</div>';
				$('.mainContent').append(html);
					dhWeb.playRT($('#play_'+deviceId)[0],deviceId,sessionStorage.getItem('loginHandle'),false);
			}
	    }
		setVideoSize();
	}

	$(".mainContent").resize(function(){
		setVideoSize();
	})
	//设置
	$(document).on("click", ".playDiv .setting", function(){
		var deviceId = $(this).parent().parent().attr("deviceid");
		var htmlDom = '<div class="settingDom">'+
			'<div>'+
				'<div class="volumeLable">设备喇叭音量：</div>'+
				'<div class="deviceVolume outputVolume"></div>'+
			'</div>'+
			'<div>'+
				'<div class="volumeLable">设备麦克风音量：</div>'+
				'<div class="deviceVolume inputVolume" ></div>'+
			'</div>'+
		'</div>';
		var _this = this;
		var volumeTimer = 0;
		layer.open({
			type: 1,
			title: false,
			offset: [$(_this).offset().top - 200, $(_this).offset().left - 280],
			area: ["300px", "170px"],
			shadeClose: true,
			content: htmlDom,
			success: function(layero, index){
				var outputSlider = slider.render({
					elem: '.outputVolume'
					,tips: false
					,input: true //输入框
					// ,disabled: true
					,change: function(value){
						dhWeb.setDeviceVolume(requestId++, sessionStorage.getItem("loginHandle"), deviceId, "output", value);
					}
				  });
				var inputSlider = slider.render({
					elem: '.inputVolume'
					,tips: false
					,input: true //输入框
					,change: function(value){
						dhWeb.setDeviceVolume(requestId++, sessionStorage.getItem("loginHandle"), deviceId, "input", value);
					}
				  });
				var getVolumeFlag = true;
				dhWeb.getDeviceVolume(requestId++, sessionStorage.getItem("loginHandle"), deviceId, "input");
				dhWeb.getDeviceVolume(requestId++, sessionStorage.getItem("loginHandle"), deviceId, "output");
				//请求超时，则默认为当前设备不支持音量操作，禁用音量设置
				volumeTimer = setTimeout(function(){
					if(getVolumeFlag){
						slider.render({
							elem: '.outputVolume'
							,tips: false
							,input: true
							,disabled: true
							,value: 0,
						  });
						slider.render({
							elem: '.inputVolume'
							,tips: false
							,input: true
							,disabled: true
							,value: 0,
						});
					}
				},3000);
				//获取设备音量回调
				dhWeb.onGetDeviceVolume = function(msg){
					getVolumeFlag = false;
					var tunnelData = JSON.parse(msg.tunnelData);
					if(!tunnelData.result) return;
					if(msg.reqData.type == "input"){
						inputSlider.setValue(tunnelData.params[0]);
					}else if(msg.reqData.type == "output"){
						outputSlider.setValue(tunnelData.params[0]);
					}

				}
			  },end:function(layero, index){
				clearTimeout(volumeTimer);
				volumeTimer = 0;
			  }
		  });
	});

	//关闭
	$(document).on("click", ".playDiv .close", function(){
		var deviceId = $(this).parent().parent().attr("deviceid");
		dhWeb.stopRT(deviceId,sessionStorage.getItem('loginHandle'));
		$(this).parent().parent().removeClass("anim-scaleSpring").addClass("anim-fadeout");
		//切换默认设备
		if($(this).parent().parent().hasClass("selectVideo") && $("video").length > 1){
			selectVideo($(".selectVideo").siblings(":first").children(".videoboxDiv"));//选择第一个视频
		}
		var thisObj = $(this);
		setTimeout(function(){
			thisObj.parent().parent().remove();
			playMusic();
			setVideoSize();
		},1000);

		// saveData();
	});
	//对讲
	$(document).on("click", ".playDiv .talk",function(){
		selectVideo($(this).parent());
		if($(this).hasClass("talking")) return;
		$(this).addClass("talking");
		var deviceId = $(this).parent().parent().attr("deviceid");
		if($(this).parent().parent().hasClass("selectVideo")){
			dhWeb.startTalk(deviceId);
		}
	});
	//开闸
	$(document).on("click", ".playDiv .unlock",function(){
		var deviceId = $(this).parent().parent().attr("deviceid");
		dhWeb.doControl(deviceId,sessionStorage.getItem('loginHandle'),1);
		layer.msg("开闸成功",{
			offset: [$(this).offset().top - 100, $(this).offset().left - 40]
		});
	});
	//关闸
	$(document).on("click", ".playDiv .locked",function(){
		var deviceId = $(this).parent().parent().attr("deviceid");
		dhWeb.doControl(deviceId,sessionStorage.getItem('loginHandle'), 2);
		layer.msg("关闸成功",{
			offset: [$(this).offset().top - 100, $(this).offset().left - 40]
		});
	});
	$(document).on("click", ".videoboxDiv",function(){
		selectVideo(this);
	});


	var socketLoginCount = timeoutLoginCount = dataTimeoutCount = repeatLoginCount = 0;

	//url中获取登录参数
	var parms_name = getQueryVariable("dhUname");
	if(parms_name){
		sessionStorage.setItem("dhUname", parms_name)
	}
	var parms_pwd = getQueryVariable("dhPwd");
	if(parms_pwd){
		sessionStorage.setItem("dhPwd", parms_pwd)
	}
	var parms_ip = getQueryVariable("dhServerIp");
	if(parms_ip){
		sessionStorage.setItem("dhServerIp", parms_ip)
	}
	var parms_port = getQueryVariable("dhPort");
	if(parms_port){
		sessionStorage.setItem("dhPort", parms_port)
	}

	if(sessionStorage.getItem("dhUname")){
		$('#uname').val(sessionStorage.getItem("dhUname"));
	}else if(localStorage.getItem("dhUname")){
		$('#uname').val(localStorage.getItem("dhUname"));
	}
	if(sessionStorage.getItem("dhPwd")){
		$('#pwd').val(sessionStorage.getItem("dhPwd"));
	}else if(localStorage.getItem("dhPwd")){
		$('#pwd').val(localStorage.getItem("dhPwd"));
	}
	if(sessionStorage.getItem("dhServerIp")){
		$('#serverIp').val(sessionStorage.getItem("dhServerIp"));
	}else if(localStorage.getItem("dhServerIp")){
		$('#serverIp').val(localStorage.getItem("dhServerIp"));
	}
	if(sessionStorage.getItem("dhPort")){
		$('#port').val(sessionStorage.getItem("dhPort"));
	}else if(localStorage.getItem("dhPort")){
		$('#port').val(localStorage.getItem("dhPort"));
	}
	var loginIndex = 0;
	form.on('submit(loginForm)', function(data){
		loginIndex = top.layer.msg('正在登录，请稍候',{icon: 16,time:false,shade:0.8});
		login();
	});

	 var dhUname = sessionStorage.getItem("dhUname");
	 var dhPwd = sessionStorage.getItem("dhPwd");
	 var dhServerIp = sessionStorage.getItem("dhServerIp");
	 var dhPort = sessionStorage.getItem("dhPort");
	 if(sessionStorage.getItem('isLogin') === "true" && dhUname != "" && dhPwd != ""){
		 $('.loginDiv').hide();
		 $('.indexDiv').show();
		 $(".username").text(dhUname);
	 }else{
		$('.indexDiv').hide();
		$('.loginDiv').show();
	 }
	 //刷新重登
	// if (window.performance.navigation.type == 1){
		if(sessionStorage.getItem('isLogin') === "true" && sessionStorage.getItem("dhUname")!= "" && sessionStorage.getItem("dhPwd") != ""){
			login();
		}
	// }
	//退出登录
	$('.logout').click(function(){
		dhWeb.logout(sessionStorage.getItem('loginHandle'));
		sessionStorage.setItem('loginHandle',null);
		sessionStorage.setItem('isLogin',false);
		$(".closeAll").hide();
		$('.indexDiv').hide();
		$('.loginDiv').show();
		removeMusic();
		map.clearMap();
		markList = [];
		$(window).resize();
	});
	//刷新页面
	$('.refresh').click(function(){
		location.reload();
	});
	//回调处理
	dhWeb.onLogin = function(message){
		if(loginIndex > 0) {
			layer.close(loginIndex);
			loginIndex = 0;
		}
		onLogin(message);
		socketLoginCount = 0;
		timeoutLoginCount = 0;
	}
	dhWeb.onDeviceList = function(message){
		dataTimeoutCount = 0;
		onDeviceList(message);
	}

	dhWeb.onNotify = function(message){
		onNotify(message);
	}
	dhWeb.onPlayRT = function(data){
		if(data.error != "success"){
			layer.msg("播放失败！" , {
				time: 5000,
				btn: ['知道了'],
				btnAlign: 'c'
			});
			$(".playDiv[deviceid="+data.params.deviceId+"] .close").click();
		}
	}
	function onLogin(data){
		var params = data.params;
		console.log(data.error);
		if(data.error == "success"){
			if(sessionStorage.getItem("dhUname") == "mainalc"){
				//超级账号登录
				location.href = "./systemCfg.html";
				return;
			}
			console.log(data.error);
			setState("在线");
			sessionStorage.setItem('loginHandle',params.loginHandle);
			sessionStorage.setItem('isLogin', true);
			$('.loginDiv').hide();
			$('.indexDiv').show();
			$(".username").text(sessionStorage.getItem("dhUname"));
			$(".device").html("");
			if(mapIsLoaded){
				//获取设备额外信息
				dhWeb.getDeviceExtra(requestId++, sessionStorage.getItem('loginHandle'), 0);
			}
			console.log("onLogin success");
		}else if(data.error == "repeat"){
			if(sessionStorage.setItem('isLogin') != "true"){
				layer.msg("账号重复登录");
				return;
			}
			repeatLoginCount++;
			if(repeatLoginCount > 5) {
				repeatLoginCount = 0;
				layer.msg("账号重复登录");
				setState("账号重复登录");
				return;
			}
			setTimeout(function(){
				login();
			},5000);
		}else if(data.error == "authfail"){
			layer.msg("账号或密码错误");
			setState("账号或密码错误");
		}else{
			layer.msg("登录失败");
			setState("登录失败");
		}
	}
	function onDeviceList(data){
		var deviceList = data.params.list;
		for(var i in deviceList){
			if($(".deviceLi[deviceid="+deviceList[i]['deviceId']+"]")[0]) return;
            var icon = getStatusIcon(deviceList[i]['action'], deviceList[i]['deviceType']);
			var deviceHtml = "<li draggable="+markerDraggable+" class='layui-nav-item deviceLi' lay-unselect deviceid='"+deviceList[i]['deviceId']+"' parentid='"+deviceList[i]['parentId']
								+"' devicestatus='"+deviceList[i]['action']+"' devicetype='"+deviceList[i]['deviceType']+"' broadcaststatus='Stop'><a href='javascript:;'>"+
						"<img src='"+icon+"' alt='' class='statusImg'></img><cite class='deviceName'>"+deviceList[i]['deviceName']+"</cite>"+
						"<img class='bcPlayStatus' src='images/bc.png' title='广播中'>"+
						"</a></li>";
			$('.device').append(deviceHtml);
		}
		dataCount();

	}

	function onNotify(data){
		var params = data.params;
		//设备状态
		if(params.code == "DeviceStatus"){

			var did = params.deviceId;
			$(".deviceLi[deviceid="+did+"]").attr("devicestatus",params.action);
			var icon = getStatusIcon(params.action, $(".deviceLi[deviceid="+did+"]").attr("deviceType"));
			$(".deviceLi[deviceid="+did+"] .statusImg").attr("src",icon);
			removeNotice(did);
			if(params.action == "Offline" || params.action == "Normal" ){
				if($("play_"+did)) $(".playDiv[deviceid="+did+"] .close").click(); //设备正在观看视频时自动挂断
			}else if(params.action == "Start"){
				var thStr = "<li class='li_notify' deviceid='"+did+"'>"+$(".deviceLi[deviceid='"+did+"'] .deviceName").text()+ "("+did+")</li>";
				$(".noticeContent,.noticeLayer").append(thStr);
				if($(".noticeLayer").length == 0)  $(".notice").click();
			}else if(params.action == "Dealing"){
			}
			if((params.action == "Start" || $(".noticeContent .li_notify").length > 0) && $(".playDiv").length == 0){
				playMusic();
			}else{
				removeMusic();
			}
			$(".notice a span").remove();
			//通知列表
			if($(".noticeContent .li_notify").length > 0){
				$(".notice a").append("<span class='layui-badge layui-bg-red'>"+$(".noticeContent .li_notify").length+"</span> ");
			}
			dataCount();
			//更新地图点图标
			updateMarkerIcon(did, params.action, "");
		}
		//广播状态
		if(params.code == "BroadcastStatus"){
			var did = params.deviceId;
			$(".deviceLi[deviceid="+did+"]").attr("broadcaststatus",params.action);
			postIframeMessage({type: "broadcast_status", msg: data});
		}

	}
	function removeNotice(deviceId){
		//移除呼叫通知类容
		$(".noticeContent .li_notify[deviceid="+deviceId+"]").remove();
		//移除呼叫弹出层
		$(".noticeLayer .li_notify[deviceid="+deviceId+"]").remove();
	}

	dhWeb.onParseMsgError = function(message){
		console.log(message);
		if(message.error.indexOf("alarmServer offline") != -1){
			setState("报警服务器不在线");
		}else{
			setState("坐席异常！");
		}
	}
	dhWeb.onAlarmServerClosed = function(){
		console.log("onAlarmServerClosed");
		if(loginIndex > 0) {
			layer.close(loginIndex);
			loginIndex = 0;
			layer.msg("登录失败" , {
				time: false,
				btn: ['知道了'],
				btnAlign: 'c'
			});
		};
		$(".deviceLi li").attr("devicestatus", "Offline");
		$(".noticeLayer .li_notify").remove();
		$(".noticeContent .li_notify").remove();
		$(".notice a span").remove();
		socketLoginCount++;
		if(socketLoginCount > 1000) {
			socketLoginCount = 0;
			setState("服务器连接断开！");
			return;
		}
		if(sessionStorage.getItem('isLogin') === "true" ){
			setTimeout(function(){
				setState("正在重新登录...");
				login();
			},5000)
		}

	}
	dhWeb.onDHAlarmWebError = function(data){
		console.log(data);
		if(data.msg.error=="loginTimeout"){
			if(sessionStorage.getItem('isLogin') !== "true") {
				if(loginIndex > 0){
					layer.close(loginIndex);
					loginIndex = 0;
				}
				layer.msg("登录超时" , {
					time: false, //5s后自动关闭
					btn: ['知道了'],
					btnAlign: 'c'
				});
				return;
			}
			setState("登录超时");
			timeoutLoginCount++;
			if(timeoutLoginCount > 100) {
				timeoutLoginCount = 0;
				return;
			}
			setState("正在重新登录...");
			login();
		}else if(data.msg.error=="dataTimeout"){
			setState("数据获取超时或该账号无设备");
			setTimeout(function(){
				dataTimeoutCount++;
				if(timeoutLoginCount > 5) {
					dataTimeoutCount = 0;
					return;
				}
				setState("正在重新登录...");
				login();
			},5000)
		}
	}

	function selectVideo(thisObj){
		if($(thisObj).parent().hasClass("selectVideo")) return;
		var preDeviceId = 0; //上一个选中的deviceId
		if($(".selectVideo").find(".talking").length > 0){ //关闭前一个对讲
			preDeviceId = $(".selectVideo").attr("deviceid");
			dhWeb.stopTalk(preDeviceId);
		}
		$(".selectVideo").removeClass("selectVideo");
		$(thisObj).parent().addClass("selectVideo");
		//切换对讲设备
		var deviceId = $(thisObj).parent().attr("deviceid");
		dhWeb.playDeviceAudio(deviceId);
		if($(thisObj).parent().find(".talking").length > 0 && preDeviceId > 0){
			dhWeb.startTalk(deviceId);
		}
	}


	function login(){
		var uname = trim($('#uname').val());
		var pwd = trim($('#pwd').val());
		var ip = trim($('#serverIp').val());
		var port = trim($('#port').val());
		port = port == "" ? 8088 : port;
		dhWeb.setWebsocketPort({dataWsPort: port,mediaWsPort: port});
		dhWeb.login(uname, pwd, ip);
		sessionStorage.setItem("dhUname", uname);
		sessionStorage.setItem("dhPwd", pwd);
		sessionStorage.setItem("dhServerIp", ip);
		sessionStorage.setItem("dhPort", port);

		localStorage.setItem("dhUname", uname);
		localStorage.setItem("dhPwd", pwd);
		localStorage.setItem("dhServerIp", ip);
		localStorage.setItem("dhPort", port);
		setState("正在登录，请稍候");
	}

	//设置视频框宽和高
	function setVideoSize(){
		var videoDivWidth = $('.mainContent').width();
		var videoDivHeight = $('.mainContent').height();
		var videoCount = $('video').length;
		if(videoCount == 0){
			$(".mainContent").css("z-index", 0);
		}else{
			$(".mainContent").css("z-index", 2);
		}
		if(videoDivWidth >= 1080){
			if(videoCount == 1){
				$('.playDiv').width(videoDivWidth-100);
				$('.playDiv').height(videoDivHeight-100);
			}else if(videoCount == 2){
				$('.playDiv').width(videoDivWidth/2-100);
				$('.playDiv').height($('.playDiv').width()*9/16);
			}else if(videoCount > 2){
				if(videoDivWidth/videoDivHeight > 16/9){
					$('.playDiv').height(videoDivHeight/2 - 50);
					$('.playDiv').width($('.playDiv').height()*16/9);
				}else{
					$('.playDiv').width(videoDivWidth/2-100);
					$('.playDiv').height($('.playDiv').width()*9/16);
				}

			}
		}else if(videoDivWidth < 1080 && videoDivHeight <= 400){
			$('.playDiv').width(videoDivWidth-50);
			$('.playDiv').height(videoDivHeight-50);
		}else{
			if(videoCount == 1){
				$('.playDiv').width(videoDivWidth-50);
				$('.playDiv').height(videoDivHeight-100);
			}else{
				if(videoDivWidth/videoDivHeight > 9/16){
					$('.playDiv').height(videoDivHeight/2 - 50);
					$('.playDiv').width($('.playDiv').height()*16/9);
				}else{
					$('.playDiv').width(videoDivWidth-50);
					$('.playDiv').height($('.playDiv').width()*9/16);
				}
			}

		}

		if($("video").length >= 1){
			$(".closeAll").css({"display": "inline-block"});
		}else{
			$(".closeAll").hide();
		}
	}
	//進入全屏
	function launchFullscreen(element)
	{
		if(isFullscreen()){
			exitFullscreen();
			return;
		}
		if(element.requestFullscreen) {
			element.requestFullscreen();
		} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.msRequestFullscreen){
			element.msRequestFullscreen();
		} else if(element.oRequestFullscreen){
			element.oRequestFullscreen();
		}else if(element.webkitRequestFullscreen){
			element.webkitRequestFullscreen();
		}
	}

	//退出全屏
	function exitFullscreen()
	{
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if(document.oRequestFullscreen){
			document.oCancelFullScreen();
		}else if (document.webkitExitFullscreen){
			document.webkitExitFullscreen();
		}else{
			var docHtml = document.documentElement;
			var docBody = document.body;
			var videobox = document.getElementById('videobox');
			docHtml.style.cssText = "";
			docBody.style.cssText = "";
			videobox.style.cssText = "";
			document.IsFullScreen = false;
		}
	}
	function isFullscreen(){
		return document.fullscreenElement    ||
			   document.msFullscreenElement  ||
			   document.mozFullScreenElement ||
			   document.webkitFullscreenElement || false;
	}
	dhWeb.onDeviceVideoData = function(data, deviceId){
		$("#play_"+deviceId).siblings('.loading').hide();
	}
	//获取设备状态图标
	function getStatusIcon(action, type){
		var icon = "";
		if(type == "Alarm"){
			if(action == "Normal"){
				icon = "./images/alarm.Normal.png";
			}else if(action == "Offline"){
				icon = "./images/alarm.Offline.png";
			}else if(action == "Start"){
				icon = "./images/alarm.Start.png";
			}else if(action == "Dealing"){
				icon = "./images/alarm.Dealing.png";
			}
		}else{
			if(action == "Normal"){
				icon = "./images/linkage.Normal.png";
			}else if(action == "Offline"){
				icon = "./images/linkage.Offline.png";
			}else if(action == "Start"){
				icon = "./images/linkage.Start.png";
			}else if(action == "Dealing"){
				icon = "./images/linkage.Dealing.png";
			}
		}
		return icon;
	}
	function setState(str){
		$(".state b").text(str);
	}
	$(document).click(function(){
       if($('#callMusic')[0]){playDeviceAudio
		   $('#callMusic')[0].play();
		}
    });
	//播放铃声
	function playMusic(){
		if($(".noticeContent .li_notify").length == 0 || $(".playDiv").lengthStart > 0) return;
		$('audio').remove();
		$('body').append('<audio id="callMusic" src="./raw/alarm.wav" autoplay hidden="true" loop="true"></audio>');
	}
	//移除播放
	function removeMusic(){
		$('audio').remove();
	}
	//数据统计
	function dataCount(){
		$(".totalCount").text($(".device").children("li").length);
		$(".onlineCount").text($(".device li[devicestatus!='Offline']").length);
	}
	function trim(s){
       return s.replace(/(^\s*)|(\s*$)/g, "");
	}

	// var victor = new Victor("container", "output");

	var granimInstance = new Granim({
		element: '#canvas',
		direction: 'diagonal', // 'diagonal', 'top-bottom', 'radial', 'left-right'
		isPausedWhenNotInView: true,
		opacity: [1, 1],
		stateTransitionSpeed: 200,
		states : {
			"default-state": {
				gradients: [
					['#0223DB', '#9EFC61'],
					['#5FA54E', '#56A9FC'],
					['#237D8D', '#9AB0FC']
				],
				transitionSpeed: 2000
			}
		}
	});
	$("#canvas").resize(function() {
		if(!granimInstance) return;
		granimInstance.setSizeAttributes();
	  });
	window.onerror = function (message, url, lineNo, columnNo, error){
		layer.closeAll();
		layer.msg("网页异常,异常信息："+message,{
				time: false,
				btn: ['知道了'],
				btnAlign: 'c'
			});
	}
	var broadcastIndex = 0;
	//实时广播
	function openRealtimeBC(){
		if(sessionStorage.getItem('isLogin') != "true"){
			layer.msg("请先登录");
			return;
		}
		var docWidth = $(document).width();
		var docHeight = $(document).height();
		var width = docWidth > 500 ? 500 : docWidth;
		var height = docHeight > 600 ? 600 : docHeight;
		if(broadcastIndex > 0) return;
		// broadcastIndex = layer.open({
        //     title : "实时广播",
        //     type : 2,
		// 	area : [width+"px",height+"px"],
		// 	shade: 0,
        //     content : "broadcast.html",
		// 	maxmin: true,
        //     success : function(layero, index){
		// 		var body = layui.layer.getChildFrame('body', index);
		// 		var iframeWin = window[layero.find('iframe')[0]['name']];
		// 		$('.deviceLi[devicetype="Alarm"][devicestatus="Normal"]').each(function(i,val){
		// 			body.find(".bcDevice").append('<li ><input type="checkbox" deviceid="'+$(this).attr("deviceid")+'" name="bcDevice" title='+$(this).text()+' lay-skin="primary"> </li>');
		// 		});
		// 		iframeWin.layui.form.render();
        //     },cancel: function(index, layero){
		// 		var body = layui.layer.getChildFrame('body', index);
		// 		if(body.find(".startBC").hasClass("layui-btn-disabled")){
		// 			layer.msg("请先停止广播");
		// 			return false;
		// 		}
		// 		layer.close(index);
		// 		broadcastIndex = 0;
		// 		return false;
		// 	}
        // })
		broadcastIndex = layer.open({
            title : "实时广播",
            type : 2,
			area : ["calc(100% - 10px)","calc(100% - 10px)"],
			shade: 0,
            content : "realtimeBC.html",
			maxmin: true,
            success : function(layero, index){
				// var body = layui.layer.getChildFrame('body', index);
				// var iframeWin = window[layero.find('iframe')[0]['name']];
				// $('.deviceLi[devicetype="Alarm"][devicestatus="Normal"]').each(function(i,val){
				// 	body.find(".bcDevice").append('<li ><input type="checkbox" deviceid="'+$(this).attr("deviceid")+'" name="bcDevice" title='+$(this).text()+' lay-skin="primary"> </li>');
				// });
				// iframeWin.layui.form.render();
            },cancel: function(index, layero){
				var body = layui.layer.getChildFrame('body', index);
				var iframeWin = window[layero.find('iframe')[0]['name']];
				if(iframeWin.bcMicStatus != "initial"){
					layer.msg("请先停止广播");
					return false;
				}
				layer.close(index);
				broadcastIndex = 0;
				return false;
			}
        })
	}
	//定时广播
	function openTimerBC(){
		if(sessionStorage.getItem('isLogin') != "true"){
			layer.msg("请先登录");
			return;
		}
		broadcastIndex = layer.open({
            title : "定时广播",
            type : 2,
			area : ["calc(100% - 10px)", "calc(100% - 10px)"],
            content : "timerBroadcast.html",
            success : function(layero, index){
				var body = layui.layer.getChildFrame('body', index);
				var iframeWin = window[layero.find('iframe')[0]['name']];

				iframeWin.layui.form.render();
            },cancel: function(index, layero){
				layer.close(index);
				broadcastIndex = 0;
				return false;
			}
        })
	}
	//二维码下发
	function openQrCode(){
		if(sessionStorage.getItem('isLogin') != "true"){
			layer.msg("请先登录");
			return;
		}
		var docWidth = $(document).width();
		var docHeight = $(document).height();
		var width = docWidth > 800 ? 800 : docWidth;
		var height = docHeight > 700 ? 700 : docHeight;
		layer.open({
            title : "二维码下发",
            type : 2,
			area : [width+"px",height+"px"],
            content : "qrCodeIssued.html",
			shadeClose: true,
            success : function(layero, index){
				var body = layui.layer.getChildFrame('body', index);
				var iframeWin = window[layero.find('iframe')[0]['name']];
				$('.deviceLi[devicetype="Alarm"][devicestatus!="Offline"]').each(function(i,val){//[devicestatus="Normal"]
					body.find(".deviceList").append('<li ><input type="radio" deviceid="'+$(this).attr("deviceid")+'" name="deviceList" title='+$(this).text()+'> </li>');
				});

				iframeWin.layui.form.render();
            },cancel: function(index, layero){
				layer.close(index);
				return false;
			}
        })
	}
	//媒体资源管理
	function openMediaSource(){
		var docWidth = $(document).width();
		var docHeight = $(document).height();
		var width = docWidth > 1000 ? 1000 : docWidth;
		var height = docHeight > 600 ? 600 : docHeight;
		layer.open({
			title : "媒体资源管理",
			type : 2,
			area : [width+"px", "calc(100% - 20px)"],
			// shade: 0,
			content : "mediaResource.html",
			success : function(layero, index){

			},cancel: function(index, layero){

			}
		})
	}
	//获取url参数
	function getQueryVariable(variable)
	{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
	}
	/************************地图******************************* */
	var lat = "",lng = "";
	var markList = [];
	var requestId = 1000;
	var loadingIndex = 0;
	var mapIsLoaded = false; //地图是否已加载完成
	var markerDraggable = false; //开启地图点拖拽
	var img = new Image();
	img.src = 'images/alarm.Dealing.png';
	//初始化地图对象，加载地图
	 var map = new AMap.Map("container", {
        resizeEnable: true,
		zooms: [4, 17],
		// rotateEnable:true,
		// pitchEnable:true,
		// pitch: 50,
		// rotation: 15,
		// viewMode:'3D'//开启3D视图,默认为关闭
    });
	$(document).on("dragover", "#container", function(event){
		event.preventDefault();
	});
	//左侧设备列表始拖动结束
	$(document).on("drop", "#container", function(event){
		if(!markerDraggable) return; // 禁止添加点
		event.preventDefault();
		var deviceId = event.originalEvent.dataTransfer.getData("deviceId"); //这里要注意，原生js的dataTransfer就是event的属性，而jQuery的dataTransfer在originalEvent里面
		setTimeout(function(){
			if(!lat || !lng) return;
			addMarker(lng, lat, deviceId);
		},100);
	});
	//左侧设备列表开始拖动
	$(document).on("dragstart", ".deviceLi", function(event){
		event.originalEvent.dataTransfer.setData("deviceId",event.currentTarget.getAttribute("deviceId"));
		event.originalEvent.dataTransfer.setDragImage(img, 15, 15);
		event.originalEvent.dataTransfer.effectAllowed = "move";
	});
	//地图加载完成
	map.on('complete', function() {
		mapIsLoaded = true;
		$(".click-card").show();
		$(".locationDiv").show();
		if(sessionStorage.getItem("isLogin") == "true"){
			//获取设备额外信息
			dhWeb.getDeviceExtra(requestId++, sessionStorage.getItem('loginHandle'), 0);
		}
    });
	//获取设备额外配置信息
	dhWeb.onGetDeviceExtra = function(data){
		var list = data.params.list;
		var markers = [];
		for(var i in list){
			if(!list[i].location) continue;
			var lnglat = list[i].location.split("_");
			var deviceId =  list[i].deviceId;
			var contact =  list[i].contact;
			var phone =  list[i].phone;
			var remark =  list[i].remark;
			var deviceStatus = $(".deviceLi[deviceid="+deviceId+"]").attr("deviceStatus");
			var marker = markList.find(function(d){
				return d.getExtData().deviceId == deviceId;
		  	});
			var extData = {"deviceId": deviceId, "contact": contact, 'phone': phone, "remark": remark};
			if(marker) {
				marker.setPosition(lnglat);
				marker.setExtData(extData);
				updateMarkerIcon(deviceId, deviceStatus, marker);
			}else{
				marker = setMarkerInfo(lnglat[0], lnglat[1],extData);
				updateMarkerIcon(deviceId, deviceStatus, marker);
				markers.push(marker);
				markList.push(marker);
			}
		}
		map.add(markers);
		map.setFitView();
	}

	var infoWindow;
	//从列表中拖动到地图添加
	function addMarker(lng, lat, deviceId) {
		var deviceStatus = $(".deviceLi[deviceid="+deviceId+"]").attr("deviceStatus");
		var marker = markList.find(function(d){
			  return d.getExtData().deviceId == deviceId;
		});
		if(marker) { //地图上已存在，更新坐标
			marker.setPosition([lng,lat]);
			dhWeb.setDeviceExtra(requestId++, sessionStorage.getItem("loginHandle"), deviceId, location, marker.getExtData().contact, marker.getExtData().phone, marker.getExtData().remark);
		}else{ //地图上不存在，添加点标记
			var extData = {"deviceId": deviceId, "contact": "", 'phone': "", "remark": ""};
			marker = setMarkerInfo(lng, lat,extData);

			markList.push(marker);
			map.add(marker);
			updateMarkerIcon(deviceId, deviceStatus, marker);
			var location = lng+"_"+lat;
			dhWeb.setDeviceExtra(requestId++, sessionStorage.getItem("loginHandle"), deviceId,location,"","","");
		}
    }
	//设置点信息
	function setMarkerInfo(lng,lat,extData){
		marker = new AMap.Marker({
			position: [lng,lat],
			draggable: markerDraggable,
			offset: new AMap.Pixel(-13, -30),
			extData: extData
		});
		infoWindow = new AMap.InfoWindow({offset: new AMap.Pixel(0, -30),closeWhenClickMap: true});
		marker.on('mouseover', infoOpen);
		marker.on('mouseout', infoClose);
		marker.on('dblclick', dblClickMarker);
		marker.on('dragend', dragendMarker);
		marker.on('dragstart', dragstartMarker);
		//绑定鼠标右击事件——弹出右键菜单
		marker.on('rightclick', function (e) {
			contextMenu.open(map, e.lnglat);
			markerPosition = e.target.getPosition();
			markerExeData = e.target.getExtData();
		});
		return marker;
	}
	map.on('mousemove', function(ev) {
		lat = lng = "";
		if(ev.lnglat){
			lat = ev.lnglat.lat;
			lng = ev.lnglat.lng;
		}
	});
	//关闭信息窗体
	function infoClose(e) {
        infoWindow.close(map, e.target.getPosition());
    }
	//打开信息窗体
    function infoOpen(e) {
        infoWindow.setContent(e.target.content);
        infoWindow.open(map, e.target.getPosition());
    }
	//地图上设备双击事件
	function dblClickMarker(e){
		var deviceId = e.target.getExtData().deviceId;
		var deviceStatus = $(".deviceLi[deviceid="+deviceId+"]").attr("deviceStatus");
		if(deviceStatus == "Offline"){
			layer.msg("设备离线，无法观看");
			return;
		}
		if(deviceStatus == "Dealing"){
			layer.msg("正在处理中，无法观看");
			return;
		}
		var callStaus = deviceStatus == "Start" ? true : false;
		playVideo(deviceId, callStaus);
	}
	//创建右键菜单
    var contextMenu = new AMap.ContextMenu();

    //右键设置
    contextMenu.addItem("设置信息内容", function () {
		var docWidth = $(document).width();
		var docHeight = $(document).height();
		var width = docWidth > 500 ? 500 : docWidth;
		var height = docHeight > 400 ? 400 : docHeight;
        layer.open({
            title : "信息设置",
            type : 2,
			area : [width+"px", height+"px"],
            content : "deviceExtra.html",
            success : function(layero, index){
				var body = layui.layer.getChildFrame('body', index);
				var iframeWin = window[layero.find('iframe')[0]['name']];
				body.find(".contact").val(markerExeData.contact);
				body.find(".phone").val(markerExeData.phone);
				body.find(".remark").val(markerExeData.remark);
				iframeWin.layui.form.render();
				body.find(".btnSave").click(function(){
					var contact = body.find(".contact").val();
					var phone = body.find(".phone").val();
					var remark = body.find(".remark").val();
					var location = markerPosition.lng+"_"+markerPosition.lat;
					dhWeb.setDeviceExtra(requestId++, sessionStorage.getItem('loginHandle'), markerExeData.deviceId, location, contact, phone, remark);
					loadingIndex = layer.msg('正在提交，请稍候',{icon: 16,time:false,shade:0.8});
					setTimeout(function(){
						if(loadingIndex > 0){
							layer.close(loadingIndex);
							loadingIndex = 0;
							layer.msg("提交失败");
						}
					},10000);
				});
            },cancel: function(index, layero){
				layer.close(index);
				return false;
			}
        })
    }, 0);
   //右键缩放至最低级别
   contextMenu.addItem("缩放至最低级别", function () {
		map.setZoomAndCenter(17, markerPosition);
	}, 1);
    //右键显示全国范围
    contextMenu.addItem("缩放至全国范围", function () {
        map.setZoomAndCenter(4, [108.946609, 34.262324]);
    }, 2);
	//右键删除
    contextMenu.addItem("删除", function () {
        dhWeb.setDeviceExtra(requestId++, sessionStorage.getItem('loginHandle'), markerExeData.deviceId, "", "", "", "");
		var markerIndex = markList.findIndex(function(d){
			return d.getExtData().deviceId == markerExeData.deviceId;
		  });
		if(markerIndex > -1) {
			map.remove(markList[markerIndex]);
			markList.splice(markerIndex, 1);
		}
    }, 3);
	//设置设备额外信息回调
	dhWeb.onSetDeviceExtra = function(data){
		layer.close(loadingIndex);
		if(data.error == "success"){
			layer.msg("设置成功");
			if(loadingIndex > 0) dhWeb.getDeviceExtra(requestId++, sessionStorage.getItem('loginHandle'), data.params.deviceId);
		}else{
			layer.msg("设置失败");
		}
		layer.closeAll("iframe");
        loadingIndex = 0;
	}
	//地图点开始拖动
	function dragstartMarker(e) {
		infoClose(e);
    }
	//地图点拖动
	function dragendMarker(e) {
		var contact = e.target.getExtData().contact;
		var deviceId = e.target.getExtData().deviceId;
		var phone = e.target.getExtData().phone;
		var remark = e.target.getExtData().remark;
		var location = e.lnglat.lng+"_"+e.lnglat.lat;
		dhWeb.setDeviceExtra(requestId++, sessionStorage.getItem("loginHandle"), deviceId,location, contact, phone, remark);
    }
	//更新点图标显示内容和状态
	function updateMarkerIcon(deviceId, deviceStatus, marker){
		if(!marker){
			marker = markList.find(function(d){
				return d.getExtData().deviceId == deviceId;
			});
		}
	  	if(!marker) return;
		var statusStr = "";
		if(deviceStatus == "Normal"){
			statusStr = "在线";
		}else if(deviceStatus == "Start"){
			statusStr = "呼叫中";
		}else if(deviceStatus == "Dealing"){
			statusStr = "处理中";
		}else if(deviceStatus == "Offline"){
			statusStr = "离线";
		}
		var name = $(".deviceLi[deviceid='"+deviceId+"'] .deviceName").text();//设备名称
		var markerContent = '' +
			'<div class="custom-content-marker" deviceId='+deviceId+' deviceStatus='+deviceStatus+'>' +
			'   <div class="icon"></div>' +
			'</div>';
		marker.setContent(markerContent);

		//设置点标签
		marker.setLabel({
			offset: new AMap.Pixel(30, 0),  //设置文本标注偏移量
			content: "<div class='txtLabel'>"+name+"</div>", //设置文本标注内容
			direction:  marker.getPosition()
		});
		// //设置地图点标记悬浮框内容
		marker.content  = '<div class ="showInfo">';
		marker.content  += '<span>名称：'+name+'</span><br>';
		marker.content += '<span>设备ID：'+deviceId+'</span><br>';
		marker.content += '<span>状态：'+statusStr+'</span><br>';
		marker.content += '<span>坐标：'+marker.getPosition().getLng()+","+marker.getPosition().getLat()+'</span><br>';
		marker.content += '<span>联系人：'+marker.getExtData().contact+'</span><br>';
		marker.content += '<span>联系电话：'+marker.getExtData().phone+'</span><br>';
		marker.content += '<span>备注：'+marker.getExtData().remark+'</span><br>';
		marker.content  += '</div>';
		var callDeviceIds = [];
		if(deviceStatus == "Start"){
			marker.setTop(true);
			$(".custom-content-marker[deviceStatus='Start']").each(function(){
				callDeviceIds.push($(this).attr("deviceId"));
			});
			callDeviceIds.push(deviceId);
			callMarkers = markList.filter(function(d){
				return callDeviceIds.indexOf(d.getExtData().deviceId) > -1;
			});
			//自适应显示呼叫中的设备
			map.setFitView(callMarkers);
		}
	}
	$("#locationBtn").on("click", function(){
		if(!map) return;
		map.setFitView();
	});
    $("#clickOn").on("click", function(){
		var _this = $(this);
		if($(this).attr('status') == "on"){
			layer.prompt({
				formType: 1,
				title: '请输入登录密码',
			},function(value, index, elem){
				if(value != sessionStorage.getItem("dhPwd")){
					layer.msg("密码错误");
					return false;
				}
				//可拖动点标记
				_this.attr('status',"off");
				_this.text("地图设备已解锁");
				markList.forEach(marker => {
					marker.setDraggable(true);
				});
				$(".deviceLi li").attr("draggable", true);
				markerDraggable = true;
				layer.close(index);
			  });

		}else{
			//禁止拖动点标记
			$(this).attr('status',"on");
			$(this).text("地图设备已锁定");
			markList.forEach(marker => {
				marker.setDraggable(false);
			});
			$(".deviceLi li").attr("draggable", false);
			markerDraggable = false;
		}

	});
	// //共享状态
	// let worker = new SharedWorker('js/shareWorker.js');
	// worker.port.postMessage({status:"add"});
	//给所有ifrmae发送通知信息
	function postIframeMessage(msg){
		for(let i =0; len = subIframeWins.length, i< len; i++){
			subIframeWins[i].postMessage(msg, location.origin);
		}
	}

}();
function getDhWeb() {
	return dhWeb;
}
