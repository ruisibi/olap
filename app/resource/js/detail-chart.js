if($ == undefined){
	$ = jQuery;
}
function insertChart(){
	$('#pdailog').dialog({
		title: '创建图形',
		width: 380,
		height: 304,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		buttons:[{
					text:'确定',
					handler:function(){
						if(curTmpInfo.selectChart == undefined){
							msginfo("您还未选择图形，请点击图形示意图片，再点确认按钮。");
						}else{
							addChart(curTmpInfo.selectChart);
							//清除数据
							delete curTmpInfo.selectChart;
							$('#pdailog').dialog('close');
						}
					}
				},{
					text:'取消',
					handler:function(){
						//清除数据
						delete curTmpInfo.selectChart;
						$('#pdailog').dialog('close');
					}
				}]
	});
	$('#pdailog').dialog('refresh', '../ruisibi/Panel!insertChart.action');
}
function chartcss(){
	//默认值
	curTmpInfo.selectChart = 'line';
	$(".chartselect .selleft ul li").bind("click", function(){
		var cid = $(this).attr("cid");
		$(".chartselect .selleft ul li").removeClass("select");
		$(this).addClass("select");
		$(".chartselect .selright .one").css("display", "none");
		$("#schart" + cid).css("display", "block");
		
		//默认选图形
		//$(".chartselect .selright .one").css("border", "none");
		//$("#schart" + cid).css("border","1px solid #FF0000");
		var tp = $("#schart" + cid).attr("tp");
		curTmpInfo.selectChart = tp;
	});
}
function addChart(tp, comp){
	curTmpInfo.charttype = tp; //放入全局对象，后面crtChart方法访问
	var name = "图形 -";
	if(tp == 'line'){
		name = name + "曲线图";
	}else if(tp == 'column'){
		name = name + "柱状图";
	}else if(tp == "pie"){
		name = name + "饼图";
	}else if(tp == "gauge"){
		name = name  + "仪表盘";
	}else if(tp == "radar"){
		name = name + "雷达图";
	}else if(tp == "scatter"){
		name = name + "散点图";
	}else if(tp == "bubble"){
		name = name + "气泡图";
	}
	if(!pageInfo.chart){
		pageInfo.chart = {};
	}
	var json = pageInfo.chart;
	if(comp){
		json.chartJson = comp.chartJson;
	}else{
		json.chartJson = {"type":tp, xcol:{}, ycol:{}, scol:{}};
	}
	
	var ispie = false;
	var isscatter = false;
	var isbubble = false;
	ispie = tp == 'pie' || tp == 'gauge';
	isscatter = tp == 'bubble' || tp == 'scatter';
	isbubble = tp == 'bubble';
	
	var str =  "<div class=\"tsbd\">" + (isscatter?"<div class=\"ts_h\">" + (ispie ? "观察维度" : "横轴")+"：<div id=\"y2col\" class=\"h_ctx\">"+(comp&&comp.kpiJson[1]!=null?"<span title=\"聚合方式\" onclick=\"chartAggreType(this,'y2col')\" class=\"grouptype\"></span><span class=\"charttxt\" style=\"width:75px;\">" + (comp.kpiJson[1].dispName!=""?comp.kpiJson[1].dispName:comp.kpiJson[1].name) + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('y2col')\"></span>":"<span class=\"charttip\">将字段拖到这里</span>")+"</div></div>":"<div class=\"ts_h\">" + (ispie ? "观察维度" : "横轴")+"：<div id=\"xcol\" class=\"h_ctx\">"+(comp&&comp.chartJson.xcol&&!$.isEmptyObject(comp.chartJson.xcol)?"<span class=\"charttxt\">" +(comp.chartJson.xcol.dispName!=""?comp.chartJson.xcol.dispName:comp.chartJson.xcol.name)+ "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('xcol')\"></span>":"<span class=\"charttip\">将字段拖到这里</span>")+"</div></div>") + 
	"<div class=\"ts_h\">"+(ispie?"度量":"纵轴")+"：<div id=\"ycol\" class=\"h_ctx\">"+(comp&&comp.kpiJson[0]!=null?"<span title=\"聚合方式\" onclick=\"chartAggreType(this, 'ycol')\" class=\"grouptype\"></span><span class=\"charttxt\" style=\"width:75px;\">" + (comp.kpiJson[0].dispName==""?comp.kpiJson[0].name:comp.kpiJson[0].dispName) + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('ycol')\"></span>":"<span class=\"charttip\">将字段拖到这里</span>")+"</div></div>" +
	(isbubble ? "<div class=\"ts_h\">气泡大小：<div id=\"y3col\" class=\"h_ctx\">"+(comp?"<span title=\"聚合方式\" onclick=\"chartAggreType(this, 'y3col')\" class=\"grouptype\"></span><span class=\"charttxt\" style=\"width:75px;\">" + (comp.kpiJson[2].dispName==""?comp.kpiJson[2].name:comp.kpiJson[2].dispName) + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('y3col')\"></span>":"<span class=\"charttip\">将字段拖到这里</span>")+"</div></div>":"") +
	(isscatter?"<div class=\"ts_h\">观察维度：<div id=\"xcol\" class=\"h_ctx\">"+(comp&&comp.chartJson.xcol&&!$.isEmptyObject(comp.chartJson.xcol)?"<span class=\"charttxt\">" +(comp.chartJson.xcol.dispName!=""?comp.chartJson.xcol.dispName:comp.chartJson.xcol.name)+ "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('xcol')\"></span>":"<span class=\"charttip\">将字段拖到这里</span>")+"</div></div>":"") +
	(isbubble ? "":"<div class=\"ts_h\" "+(ispie?"style=\"display:none\"":"")+">图例：<div id=\"scol\" class=\"h_ctx\">"+(comp&&comp.chartJson.scol&&!$.isEmptyObject(comp.chartJson.scol)?"<span class=\"charttxt\">" + (comp.chartJson.scol.dispName!=""?comp.chartJson.scol.dispName:comp.chartJson.scol.name) + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('scol')\"></span>":"<span class=\"charttip\">将字段拖到这里</span>")+"</div></div>") + "</div>" + 
	(ispie||isscatter ? "" :"<div class=\"exchangexs\"><img src='../resource/img/exchangexs1.gif'><a title='交换维度' href='javascript:exchangexs();'><img src='../resource/img/reload.png' border='0'></a><img src='../resource/img/exchangexs2.gif'></div>") + 
	"<div class=\"chartctx\" style=\""+(isscatter?"height:220px;":"")+"\">图形预览区域</div>";
	
	var ctx = "<div id=\"T3\" class=\"comp_table\"><div class=\"title\"><div class=\"tname\">"+name+"</div><div class=\"mvcomp\"></div><div class=\"ticon\"><a href=\"javascript:;\" id=\"removechartbtn\" title=\"删除对象\"></a></div></div><div class=\"ctx\"> "+str+" </div></div>";
	$("#chart_div").html(ctx);
	var p = $("#T3").offset();
	$("#optarea").scrollTop(p.top);
	$("#removechartbtn").click(function(){
		$("#chart_div").html("");
		delete pageInfo.chart;
	});
	//注册图形拖拽事件
	if(curTmpInfo.charttype == 'bubble' || curTmpInfo.charttype == 'scatter'){
		initChartByScatter();
	}else{
		initChartKpiDrop()
	}
	if(comp){
		chartview(comp);
	}
};
function initChartKpiDrop(){
	var id = 3;
	$("#T" + id + " #xcol, #T" + id +" #ycol, #T"+id+" #scol").droppable({
		accept:"#selectdatatree .tree-node",
		onDragEnter:function(e,source){
			$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
			$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
			$("#T"+id+" #"+$(this).attr("id")).css("border-color", "#ff0000");
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDragLeave:function(e,source){
			$(source).draggable('proxy').find("span").addClass("tree-dnd-no");
			$(source).draggable('proxy').find("span").removeClass("tree-dnd-yes");
			$("#T"+id+" #"+$(this).attr("id")).css("border-color", "#7F9DB9");
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDrop:function(e,source){
			//清除边框样式
			$("#T"+id+" #"+$(this).attr("id")).css("border-color", "#7F9DB9");
			//获取TREE
			var node = $("#selectdatatree").tree("getNode", source);
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
			var json = pageInfo.chart;
			
			if(json.datasetid && json.datasetid != node.attributes.tid){
				msginfo("你拖入的字段"+node.text+"与图形已有的内容不在同一个数据集中，拖放失败！");
				return;
			}else{
				json.datasetid = node.attributes.tid;
			}
			if(json.kpiJson == undefined){
				json.kpiJson = [];
			};
			
			if($(this).attr("id") == "ycol"){  //纵轴
				if(json.chartJson.xcol != undefined && json.chartJson.xcol.id == node.id){
					msginfo("您拖放的字段已存在于横轴中，不能拖放。")
					return;
				}
				if(json.chartJson.scol != undefined && json.chartJson.scol.id == node.id){
					msginfo("您拖放的字段已存在于图例中，不能拖放。")
					return;
				}
				json.kpiJson = [];
				json.kpiJson.push({id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression,aggre:'count'});
				json.chartJson.ycol = {"type":"kpi"};
				$(this).html("<span title=\"聚合方式\" onclick=\"chartAggreType(this,'ycol')\" class=\"grouptype\"></span><span class=\"charttxt\" style=\"width:75px;\">" + node.text + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('ycol')\"></span>");
				curTmpInfo.isupdate = true;
				chartview(json);
			}
			if($(this).attr("id") == "xcol"){
				//判断是否在xcol中已经存在
				if(json.chartJson.scol != undefined && json.chartJson.scol.id == node.id){
					msginfo("您拖放的字段已存在于图例项中，不能拖放。")
					return;
				}
				if(kpiExist(json.kpiJson, node.id)){
					msginfo("您拖放的字段已存在于纵轴中，不能拖放。")
					return;
				}
				
				json.chartJson.xcol = {id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('xcol')\"></span>");
				curTmpInfo.isupdate = true;
				chartview(json);
			}
			if($(this).attr("id") == "scol"){
				//判断是否在xcol中已经存在
				if(json.chartJson.xcol != undefined && json.chartJson.xcol.id == node.id){
					msginfo("您拖放的字段已存在于横轴中，不能拖放。")
					return;
				}
				if(kpiExist(json.kpiJson, node.id)){
					msginfo("您拖放的字段已存在于纵轴中，不能拖放。")
					return;
				}
				json.chartJson.scol =  {id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('scol')\"></span>");
				curTmpInfo.isupdate = true;
				chartview(json);
			}
		}
	});
}
function kpiExist(kpiJson, id){
	var ret = false;
	for(k=0; kpiJson&&k<kpiJson.length; k++){
		if(kpiJson[k] != null && kpiJson[k].id == id ){
			ret = true;
			break;
		}
	}
	return ret;
}
/**
对于气泡图、 散点图， 横轴和纵轴都是指标，序列是维度，处理方式和其他图形不一样，需特殊处理
*/
function initChartByScatter(){
	var id = 3;
	$("#T" + id + " #xcol, #T" + id +" #ycol, #T"+id+" #y2col, #T"+id+" #y3col, #T"+id+" #scol").droppable({
		accept:"#selectdatatree .tree-node",
		onDragEnter:function(e,source){
			var node = $("#datasettree").tree("getNode", source);
			$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
			$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
			$("#T3 #"+$(this).attr("id")).css("border-color", "#ff0000");
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDragLeave:function(e,source){
			$(source).draggable('proxy').find("span").addClass("tree-dnd-no");
			$(source).draggable('proxy').find("span").removeClass("tree-dnd-yes");
			$("#T3 #"+$(this).attr("id")).css("border-color", "#7F9DB9");
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDrop:function(e,source){
			//清除边框样式
			$("#T3 #"+$(this).attr("id")).css("border-color", "#7F9DB9");
			//获取TREE
			var node = $("#selectdatatree").tree("getNode", source);
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
			var json = pageInfo.chart;
			
			if(json.datasetid && json.datasetid != node.attributes.tid){
				msginfo("你拖入的字段"+node.text+"与图形已有的内容不在同一个数据集中，拖放失败！");
				return;
			}else{
				json.datasetid = node.attributes.tid;
			}
			if(!json.kpiJson){
				if(json.chartJson.type == "bubble"){
					json.kpiJson = [null, null, null];  //气泡图3指标
				}else{
					json.kpiJson = [null, null]; //散点图2指标
				}
			}
			if($(this).attr("id") == "ycol"){
				if(json.chartJson.xcol != undefined && json.chartJson.xcol.id == node.id){
					msginfo("您拖放的字段已存在，不能拖放。")
					return;
				}
				if(json.chartJson.scol != undefined && json.chartJson.scol.id == node.id){
					msginfo("您拖放的字段已存在，不能拖放。")
					return;
				}
				json.kpiJson[0] = {id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression,aggre:'count'};
				json.chartJson.ycol = {"type":"kpi"};
				$(this).html("<span title=\"聚合方式\" onclick=\"chartAggreType(this, 'ycol')\" class=\"grouptype\"></span><span class=\"charttxt\" style=\"width:75px;\">" + node.text + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('ycol')\"></span>");
				curTmpInfo.isupdate = true;
			}
			if($(this).attr("id") == "y2col"){
				if(json.chartJson.xcol != undefined && json.chartJson.xcol.id == node.id){
					msginfo("您拖放的字段已存在，不能拖放。")
					return;
				}
				if(json.chartJson.scol != undefined && json.chartJson.scol.id == node.id){
					msginfo("您拖放的字段已存在，不能拖放。")
					return;
				}
				json.kpiJson[1] = {id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression,aggre:'count'};
				json.chartJson.ycol = {"type":"kpi"};
				$(this).html("<span title=\"聚合方式\" onclick=\"chartAggreType(this, 'y2col')\" class=\"grouptype\"></span><span class=\"charttxt\" style=\"width:75px;\">" + node.text + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('y2col')\"></span>");
				curTmpInfo.isupdate = true;
				
			}
			if($(this).attr("id") == "y3col"){
				if(json.chartJson.xcol != undefined && json.chartJson.xcol.id == node.id){
					msginfo("您拖放的字段已存在，不能拖放。")
					return;
				}
				if(json.chartJson.scol != undefined && json.chartJson.scol.id == node.id){
					msginfo("您拖放的字段已存在，不能拖放。")
					return;
				}
				json.kpiJson[2] = {id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression,aggre:'count'};
				json.chartJson.ycol = {"type":"kpi"};
				$(this).html("<span title=\"聚合方式\" onclick=\"chartAggreType(this, 'y3col')\" class=\"grouptype\"></span><span class=\"charttxt\" style=\"width:75px;\">" + node.text + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('y3col')\"></span>");
				curTmpInfo.isupdate = true;
				
			}
			if($(this).attr("id") == "xcol"){
				//判断是否在xcol中已经存在
				if(json.chartJson.scol != undefined && json.chartJson.scol.id == node.id){
					msginfo("您拖放的字段已存在于图例项中，不能拖放。")
					return;
				}
				if(kpiExist(json.kpiJson, node.id)){
					msginfo("您拖放的字段已存，不能拖放。")
					return;
				}
				
				json.chartJson.xcol = {id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('xcol')\"></span>");
				curTmpInfo.isupdate = true;
			}
			if($(this).attr("id") == "scol"){
				//判断是否在xcol中已经存在
				if(json.chartJson.xcol != undefined && json.chartJson.xcol.id == node.id){
					msginfo("您拖放的字段已存，不能拖放。")
					return;
				}
				if(kpiExist(json.kpiJson, node.id)){
					msginfo("您拖放的字段已存在，不能拖放。")
					return;
				}
				json.chartJson.scol =  {id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('scol')\"></span>");				
				curTmpInfo.isupdate = true;
			}
			if(json.chartJson.type == 'scatter'){
				if(json.kpiJson[0] != null && json.kpiJson[1] != null){
					chartview(json);
				}
			}
			if(json.chartJson.type == 'bubble'){
				if(json.kpiJson[0] != null && json.kpiJson[1] != null && json.kpiJson[2] != null){
					chartview(json);
				}
			}
		}
	});
}
function chartAggreType(ts, tp){
	var chart = pageInfo.chart;
	$("#aggretypemenu").children().each(function(index, element) {
        $("#aggretypemenu").menu("setIcon", {target:$(this), iconCls:"icon-blank"});
    });
	var id;
	if(tp == "ycol"){
		id = 0;
	}else if(tp == "y2col"){
		id = 1;
	}else{
		id = 2;
	}
	curTmpInfo.ycolIdx = id;
	$("#aggretypemenu").menu("setIcon", {target:$("#aggre_" + chart.kpiJson[id].aggre), iconCls:"icon-ok"});
	var offset = $(ts).offset();
	$("#aggretypemenu").menu("show", {left:offset.left, top:offset.top + 20});
}
function kpiAggreType(tp){
	var chart = pageInfo.chart;
	var type = chart.kpiJson[curTmpInfo.ycolIdx].type;
	if(tp != 'count'){
		if(type != 'Int' && type != 'Double'){
			msginfo("字段类型不是数字类型， 不能进行 "+tp+" 运算。");
			return;
		}
	}
	chart.kpiJson[curTmpInfo.ycolIdx].aggre = tp;
	chartview(chart);
	curTmpInfo.isupdate = true;
}
function chartview(json){
	if(!json || !json.kpiJson || json.kpiJson.length == 0){
		return;
	}
	if(json.chartJson.type == "scatter" && (json.kpiJson[0] == null || json.kpiJson[1] == null)){
		return;
	}
	if(json.chartJson.type == "bubble" && (json.kpiJson[0] == null || json.kpiJson[1] == null  || json.kpiJson[2] == null)){
		return;
	}
	var chartJson = JSON.stringify(json.chartJson);
	var kpiJson = JSON.stringify(json.kpiJson);
	//处理参数
	var params = [];
	if(pageInfo.params && pageInfo.params.length > 0){
		for(k=0; k<pageInfo.params.length; k++){
			if(pageInfo.params[k].tid == json.tid){
				params.push(pageInfo.params[k]);
			}
		}
	}
	var dset = findDatasetById(json.datasetid);
	if(dset == null){
		$("#T3 div.ctx").html("组件关联的数据集已经失效，请移除该组件。");
		return;
	}
	var dsource = findDatasourceById(dset.dsid);
	if(dsource == null){
		$("#T3 div.ctx").html("组件关联的数据源已经失效，请移除该组件。");
		return;
	}
	showloading();
	$.ajax({
	   type: "POST",
	   url: "ChartView.action",
	   dataType:"html",
	   data: {"chartJson":chartJson, "kpiJson":kpiJson,"params":JSON.stringify(params), "dset":JSON.stringify(dset), "dsource":JSON.stringify(dsource)},
	   success: function(resp){
		   hideLoading();
		  //清除DIV高度
		  $("#T3 div.chartctx").css("height", "auto");
		  
		  $("#T3 div.chartctx").html(resp);
	   },
	   error:function(resp){
		   hideLoading();
		   $.messager.alert('出错了','系统出错，请联系管理员。','error');
	   }
	});
}
function delChartCol(tp){
	var json = pageInfo.chart;
	var compId = 3;
	if(tp == 'xcol'){
		json.chartJson.xcol = {};
		$("#T"+compId+" #xcol").html("<span class=\"charttip\">将字段拖到这里</span>");
		curTmpInfo.isupdate = true;
		chartview(json, compId);
	}
	if(tp == 'ycol'){
		json.chartJson.ycol = {};
		if(json.kpiJson.length > 1){
			json.kpiJson[0] = null;
		}else{
			json.kpiJson = [];
		}
		$("#T"+compId+" #ycol").html("<span class=\"charttip\">将字段拖到这里</span>");
	}
	if(tp == 'y2col'){
		if(json.kpiJson.length > 1){
			json.kpiJson[1] = null;
		}else{
			json.kpiJson = [];
		}
		$("#T"+compId+" #y2col").html("<span class=\"charttip\">将字段拖到这里</span>");
	}
	if(tp == 'y3col'){
		json.kpiJson[2] = null;
		$("#T"+compId+" #y3col").html("<span class=\"charttip\">将字段拖到这里</span>");
	}
	if(tp == 'scol'){
		json.chartJson.scol = {};
		$("#T"+compId+" #scol").html("<span class=\"charttip\">将字段拖到这里</span>");
		curTmpInfo.isupdate = true;
		chartview(json, compId);
	}
}
function exchangexs(){
	var comp = pageInfo.chart;
	if(!comp){
		return;
	}
	if(comp.chartJson == undefined || (comp.chartJson.xcol == undefined && comp.chartJson.scol == undefined)){
		msginfo("您还未选择维度。");
	}
	var tmp = comp.chartJson.xcol;
	comp.chartJson.xcol = comp.chartJson.scol;
	comp.chartJson.scol = tmp;
	var compId = 3;
	
	//更新显示内容
	if(comp.chartJson.xcol && comp.chartJson.xcol.id){	
		var node = comp.chartJson.xcol;
		$("#T" + compId + " #xcol").html("<span class=\"charttxt\">" + (comp.chartJson.xcol.dispName!=""?comp.chartJson.xcol.dispName:comp.chartJson.xcol.name) + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('xcol')\"></span>");
	}else{
		$("#T"+compId+" #xcol").html("<span class=\"charttip\">将维度拖到这里</span>");
	}
	if(comp.chartJson.scol && comp.chartJson.scol.id){	
		var node = comp.chartJson.scol;
		$("#T" + compId + " #scol").html("<span class=\"charttxt\">" + (comp.chartJson.scol.dispName!=""?comp.chartJson.scol.dispName:comp.chartJson.scol.name) + "</span><span class=\"chartdel\" title=\"配置\" onclick=\"delChartCol('scol')\"></span>");
	}else{
		$("#T"+compId+" #scol").html("<span class=\"charttip\">将维度拖到这里</span>");
	}
	curTmpInfo.isupdate = true;
	chartview(comp);
	
}

function formatNumber(num,pattern){
  if(pattern.indexOf("%") > 0){
	  num = num * 100;
  }
  var fmtarr = pattern?pattern.split('.'):[''];
  var retstr='';
  
  //先对数据做四舍五入
  var xsw = 0;
  if(fmtarr.length > 1){
	  xsw = fmtarr[1].length;
  }
  var bl = 1;
  for(i=0; i<xsw; i++){
	  bl = bl * 10;
  }
  num = num * bl;
  num = Math.round(num);
  num = num / bl;
  
  var strarr = num?num.toString().split('.'):['0'];
 
  // 整数部分
  var str = strarr[0];
  var fmt = fmtarr[0];
  var i = str.length-1;  
  var comma = false;
  for(var f=fmt.length-1;f>=0;f--){
    switch(fmt.substr(f,1)){
      case '#':
        if(i>=0 ) retstr = str.substr(i--,1) + retstr;
        break;
      case '0':
        if(i>=0) retstr = str.substr(i--,1) + retstr;
        else retstr = '0' + retstr;
        break;
      case ',':
        comma = true;
        retstr=','+retstr;
        break;
    }
  }
  if(i>=0){
    if(comma){
      var l = str.length;
      for(;i>=0;i--){
        retstr = str.substr(i,1) + retstr;
        if(i>0 && ((l-i)%3)==0) retstr = ',' + retstr; 
      }
    }
    else retstr = str.substr(0,i+1) + retstr;
  }

  retstr = retstr+'.';
  // 处理小数部分
  str=strarr.length>1?strarr[1]:'';
  fmt=fmtarr.length>1?fmtarr[1]:'';
  i=0;
  for(var f=0;f<fmt.length;f++){
    switch(fmt.substr(f,1)){
      case '#':
        if(i<str.length) retstr+=str.substr(i++,1);
        break;
      case '0':
        if(i<str.length) retstr+= str.substr(i++,1);
        else retstr+='0';
        break;
    }
  }

  var r = retstr.replace(/^,+/,'').replace(/\.$/,''); 
  if(pattern.indexOf("%") > 0){
	  r = r + "%";
  } 
  return r;
}