if($ == undefined){
	$ = jQuery;
}
function crtChart(compId){
	var ispie = false;
	var isscatter = false;
	var isbubble = false;
	if(curTmpInfo.charttype){
		ispie = curTmpInfo.charttype == 'pie' || curTmpInfo.charttype == 'gauge';
		isscatter = curTmpInfo.charttype == 'bubble' || curTmpInfo.charttype == 'scatter';
		isbubble = curTmpInfo.charttype == 'bubble';
	}else{
		var comp = findCompById(compId);
		ispie = comp.chartJson.type == 'pie' ||  comp.chartJson.type == 'gauge';
		isscatter = comp.chartJson.type == 'bubble' ||  comp.chartJson.type == 'scatter';
		isbubble = comp.chartJson.type == 'bubble';
	}
	return "<div class=\"tsbd\">" + (isscatter?"<div class=\"ts_h\">" + (ispie ? "观察维度" : "横轴")+"：<div id=\"y2col\" class=\"h_ctx\"><span class=\"charttip\">"+"将度量拖到这里"+"</span></div></div>":"<div class=\"ts_h\">" + (ispie ? "观察维度" : "横轴")+"：<div id=\"xcol\" class=\"h_ctx\"><span class=\"charttip\">"+"将维度拖到这里"+"</span></div></div>") + 
	"<div class=\"ts_h\">"+(ispie?"度量":"纵轴")+"：<div id=\"ycol\" class=\"h_ctx\"><span class=\"charttip\">将度量拖到这里</span></div></div>" +
	(isbubble ? "<div class=\"ts_h\">气泡大小：<div id=\"y3col\" class=\"h_ctx\"><span class=\"charttip\">将度量拖到这里</span></div></div>":"") +
	(isscatter?"<div class=\"ts_h\">观察维度：<div id=\"xcol\" class=\"h_ctx\"><span class=\"charttip\">"+"将度量拖到这里"+"</span></div></div>":"") +
	(isbubble ? "":"<div class=\"ts_h\" "+(ispie?"style=\"display:none\"":"")+">图例：<div id=\"scol\" class=\"h_ctx\"><span class=\"charttip\">将维度拖到这里</span></div></div>") + "</div>" + 
	(ispie||isscatter ? "" :"<div class=\"exchangexs\"><img src='../resource/img/exchangexs1.gif'><a title='交换维度' href='javascript:exchangexs("+compId+", true);'><img src='../resource/img/reload.png' border='0'></a><img src='../resource/img/exchangexs2.gif'></div>") + 
	"<div class=\"chartctx\" style=\""+(isscatter?"height:220px;":"")+"\">图形预览区域</div>";
}
function addChart(tp){
	curTmpInfo.charttype = tp; //放入全局对象，后面crtChart方法访问
	var compId = getMaxCompId();
	var name = "图形组件-";
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
	addComp(compId, name, null, true, 'chart');
	var json = findCompById(compId);
	json.chartJson = {"type":tp, xcol:{}, ycol:{}, scol:{}, params:[]};
};
function insertChart(){
	$('#pdailog').dialog({
		title: '插入图形',
		width: 380,
		height: 376,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		buttons:[{
					text:'确定',
					iconCls:"icon-ok",
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
					iconCls:"icon-cancel",
					handler:function(){
						//清除数据
						delete curTmpInfo.selectChart;
						$('#pdailog').dialog('close');
					}
				}]
	});
	$('#pdailog').dialog('refresh', 'Panel!insertChart.action');
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
	/**
	$(".chartselect .selright .one").bind("click", function(){
		$(".chartselect .selright .one").css("border", "none");
		$(this).css("border","1px solid #FF0000");
		var tp = $(this).attr("tp");
		curTmpInfo.selectChart = tp;
	});
	**/
}
function chartview(json, compId){
	if(json.kpiJson == undefined || json.kpiJson.length == 0){
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
	//获取cube
	var cube = fundCubeById(json.tid);
	if(cube == null){
		$("#T" + compId + " div.ctx").html("组件关联的立方体已经失效，请移除该组件。");
		return;
	}
	var dset = findDatasetById(cube.datasetid);
	if(dset == null){
		$("#T" + compId + " div.ctx").html("组件关联的数据集已经失效，请移除该组件。");
		return;
	}
	//dset只取部分信息, 如果立方体是聚集立方体，取立方体聚集表
	var ndset = {name:dset.name, master:dset.master, aggreTable:cube.aggreTable, joininfo:dset.joininfo, param:dset.param};
	var dsource = findDatasourceById(dset.dsid);
	if(dsource == null){
		$("#T" + compId + " div.ctx").html("组件关联的数据源已经失效，请移除该组件。");
		return;
	}
	//获取cubeKpis 用在数据缓存中
	var cubeKpis = [];
	for(i=0; i<cube.kpi.length; i++){
		var k = cube.kpi[i];
		var alias = k.aggre+"_" + k.id; //查询SQL的别名是 aggre+id
		cubeKpis.push({calc:(k.calc==true?true:false),col_name:k.col,aggre:k.aggre,alias:alias,tname:k.tname});
	}
	showloading();
	$.ajax({
	   type: "POST",
	   url: "ChartView.action",
	   dataType:"html",
	   data: {"chartJson":chartJson, "kpiJson":kpiJson, divison:(cube.divison?JSON.stringify(cube.divison):"{}"),"compId":compId, "cubeId":(cube.cache?cube.id:""), "params":JSON.stringify(params), "dset":JSON.stringify(ndset), "dsource":JSON.stringify(dsource),"cubeKpis":(cube.cache?JSON.stringify(cubeKpis):"[]")},
	   success: function(resp){
		   hideLoading();
		  //清除DIV高度
		  $("#T" + compId + " div.chartctx").css("height", "auto");
		  
		  $("#T" + compId + " div.chartctx").html(resp);
	   },
	   error:function(resp){
		   hideLoading();
		   $.messager.alert('出错了','系统出错，请查看后台日志。','error');
	   }
	});
}
function initChartKpiDrop(id){
	$("#T" + id + " #xcol, #T" + id +" #ycol, #T"+id+" #scol").droppable({
		accept:"#selectdatatree .tree-node",
		onDragEnter:function(e,source){
			var node = $("#selectdatatree").tree("getNode", source);
			var tp = node.attributes.col_type;
			if(tp == 1 && ($(this).attr("id") == 'xcol' || $(this).attr("id") == 'scol')){
				$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
				$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
				$("#T"+id+" #"+$(this).attr("id")).css("border-color", "#ff0000");
			}
			
			if(tp == 2 && $(this).attr("id") == "ycol"){
				$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
				$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
				$("#T"+id+" #ycol").css("border-color", "#ff0000");
			}
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
			var id = $(this).parents(".comp_table").attr("id").replace("T","");
			var json = findCompById(Number(id));
			//清除边框样式
			$("#T"+id+" #"+$(this).attr("id")).css("border-color", "#7F9DB9");
			//获取TREE
			var node = $("#selectdatatree").tree("getNode", source);
			
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
			
			//判断拖入的维度及指标是否和以前维度及指标在同一个表。
			if(json.tid != undefined){
				if(json.tid != node.attributes.tid){
					msginfo("您拖入的"+ (node.attributes.col_type == 2 ? "度量" : "维度") +"与组件已有的内容不在同一个数据表中，拖放失败。");
					return;
				}
			}
			
			//判断拖入的指标是否是（同比、环比），如果是，需要判断当前维度是否有date类型
			if(node.attributes.calc_kpi == 1){
				if(!isExistDateDim(json, 'chart')){
					msginfo("您拖入的度量需要图形中有时间类型的维度(年/季度/月/日)。");
					return;
				}
			}
		
			json.tid = node.attributes.tid;
			
			if(json.kpiJson == undefined){
				json.kpiJson = [];
			};
			/**
			if(!json.chartJson || !json.chartJson.xcol || !json.chartJson.ycol || !json.chartJson.scol || !json.chartJson.params){
				json.chartJson = {"xcol":{}, "ycol":{}, "scol":{}, "params":[]};
			}
			**/
			
			//拖放指标后，判断维度是否在params中
			if(node.attributes.col_type == 1){
				var dimId = node.attributes.col_id;
				if(findDimById(dimId, json.chartJson.params) != null){
					msginfo("您拖放的维度已存在于钻取维中，不能拖放。")
					return;
				}
			}
			
			if(node.attributes.col_type == 2 && $(this).attr("id") == "ycol"){
				json.kpiJson = [];
				json.kpiJson.push({"kpi_id":node.attributes.col_id, "kpi_name" : node.text, "col_name":node.attributes.col_name, "aggre":node.attributes.aggre, "fmt":node.attributes.fmt, "alias":node.attributes.alias,"tid":json.tid,"unit":node.attributes.unit,"rate":node.attributes.rate,"tname":node.attributes.tname,"calc":node.attributes.calc,"dyna":node.attributes.dyna});
				json.chartJson.ycol = {"type":"kpi"};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.attributes.col_id+",'ycol','"+node.text+"')\"></span>");
				curTmpInfo.isupdate = true;
				chartview(json, id);
			}
			if(node.attributes.col_type == 1 && $(this).attr("id") == "xcol"){
				//判断是否在xcol中已经存在
				if(json.chartJson.scol != undefined && json.chartJson.scol.id == node.attributes.col_id){
					msginfo("您拖放的维度已存在于图例项中，不能拖放。")
					return;
				}
				
				//判断xcol 和 scol 是否属于一个分组，如果是，不让拖动
				var gt = node.attributes.grouptype;
				if(gt != null && gt != ''){
					if(json.chartJson.scol != undefined && json.chartJson.scol.grouptype == gt){
						msginfo("您拖放的维度与此图形中已有维度分类相同，不能拖放。")
						return;
					}
				}
				
				json.chartJson.xcol = {"id":node.attributes.col_id, "dimdesc" : node.text, "type":node.attributes.dim_type, "colname":node.attributes.col,"tid":json.tid,"iscas":node.attributes.iscas,"tname":node.attributes.tname, "tableName":node.attributes.tableName, "tableColKey":node.attributes.tableColKey,"tableColName":node.attributes.tableColName, "dimord":node.attributes.dimord, "dim_name":node.attributes.dim_name, "grouptype":node.attributes.grouptype,"valType":node.attributes.valType,"dyna":node.attributes.dyna,"ord":node.attributes.ord,dateformat:node.attributes.dateformat};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.attributes.col_id+",'xcol', '"+node.text+"')\"></span>");
				curTmpInfo.isupdate = true;
				chartview(json, id);
			}
			if(node.attributes.col_type == 1 && $(this).attr("id") == "scol"){
				//判断是否在xcol中已经存在
				if(json.chartJson.xcol != undefined && json.chartJson.xcol.id == node.attributes.col_id){
					msginfo("您拖放的维度已存在于横轴中，不能拖放。")
					return;
				}
				
				//判断xcol 和 scol 是否属于一个分组，如果是，不让拖动
				var gt = node.attributes.grouptype;
				if(gt != null && gt != ''){
					if(json.chartJson.xcol != undefined && json.chartJson.xcol.grouptype == gt){
						msginfo("您拖放的维度与此图形中已有维度分类相同，不能拖放。")
						return;
					}
				}
				
				json.chartJson.scol = {"id":node.attributes.col_id, "dimdesc" : node.text, "type":node.attributes.dim_type, "colname":node.attributes.col,"tid":json.tid,"iscas":node.attributes.iscas,"tname":node.attributes.tname, "tableName":node.attributes.tableName, "tableColKey":node.attributes.tableColKey,"tableColName":node.attributes.tableColName, "dimord":node.attributes.dimord, "dim_name":node.attributes.dim_name, "grouptype":node.attributes.grouptype,"valType":node.attributes.valType,"dyna":node.attributes.dyna,"ord":node.attributes.ord,dateformat:node.attributes.dateformat};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this,"+node.attributes.col_id+", 'scol', '"+node.text+"')\"></span>");
				curTmpInfo.isupdate = true;
				chartview(json, id);
			}
		}
	});
}
/**
对于气泡图、 散点图， 横轴和纵轴都是指标，序列是维度，处理方式和其他图形不一样，需特殊处理
*/
function initChartByScatter(id){
	$("#T" + id + " #xcol, #T" + id +" #ycol, #T"+id+" #y2col, #T"+id+" #y3col, #T"+id+" #scol").droppable({
		accept:"#selectdatatree .tree-node",
		onDragEnter:function(e,source){
			var node = $("#datasettree").tree("getNode", source);
			var tp = node.attributes.col_type;
			if(tp == 1 && ($(this).attr("id") == 'scol' || $(this).attr("id") == 'xcol' )){
				$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
				$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
				$("#T"+id+" #"+$(this).attr("id")).css("border-color", "#ff0000");
			}
			
			if(tp == 2 && ($(this).attr("id") == "ycol" || $(this).attr("id") == 'y2col' || $(this).attr("id") == 'y3col')){
				$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
				$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
				$("#T"+id+" #"+$(this).attr("id")).css("border-color", "#ff0000");
			}
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
			var id = $(this).parents(".comp_table").attr("id").replace("T","");
			var json = findCompById(Number(id));
			//清除边框样式
			$("#T"+id+" #"+$(this).attr("id")).css("border-color", "#7F9DB9");
			//获取TREE
			var node = $("#datasettree").tree("getNode", source);
			
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
			
			//判断拖入的维度及指标是否和以前维度及指标在同一个表。
			if(json.tid != undefined){
				if(json.tid != node.attributes.tid){
					msginfo("您拖入的"+ (node.attributes.col_type == 2 ? "度量" : "维度") +"与图形已有的内容不在同一个立方体中，拖放失败。");
					return;
				}
			}
			
			//判断拖入的指标是否是（同比、环比），如果是，需要判断当前维度是否有date类型
			if(node.attributes.calc_kpi == 1){
				if(!isExistDateDim(json, 'chart')){
					msginfo("您拖入的度量需要图形中有时间类型的维度(年/季度/月/日)。");
					return;
				}
			}
		
			json.tid = node.attributes.tid;
			
			if(json.kpiJson == undefined){
				json.kpiJson = [];
			};
			
			//拖放指标后，判断维度是否在params中
			if(node.attributes.col_type == 1){
				var dimId = node.attributes.col_id;
				if(findDimById(dimId, json.chartJson.params) != null){
					msginfo("您拖放的维度已存在于钻取维中，不能拖放。")
					return;
				}
			}
			
			if(node.attributes.col_type == 2 && $(this).attr("id") == "ycol"){
				if(!json.kpiJson){
					json.kpiJson = [null, null, null];
				}
				//判断指标是否存在
				if((json.kpiJson[1] != null && json.kpiJson[1].kpi_id == node.attributes.col_id) || (json.kpiJson[2] != null && json.kpiJson[2].kpi_id == node.attributes.col_id)){
					msginfo("您拖放的度量已存在当前图形中。")
					return;
				}
				json.kpiJson[0] = {"kpi_id":node.attributes.col_id, "kpi_name" : node.text, "col_name":node.attributes.col_name, "aggre":node.attributes.aggre, "tname":node.attributes.tname, "fmt":node.attributes.fmt, "alias":node.attributes.alias,"tid":json.tid,"unit":node.attributes.unit,"rate":node.attributes.rate,"calc":node.attributes.calc,"dyna":node.attributes.dyna};
				json.chartJson.ycol = {"type":"kpi"};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.attributes.col_id+",'ycol','"+node.text+"')\"></span>");
				curTmpInfo.isupdate = true;
				if(json.chartJson.type == 'scatter'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null){
						chartview(json, id);
					}
				}
				if(json.chartJson.type == 'bubble'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null && json.kpiJson[2] != null){
						chartview(json, id);
					}
				}
			}
			if(node.attributes.col_type == 2 && $(this).attr("id") == "y2col"){
				if(!json.kpiJson){
					json.kpiJson = [null, null, null];
				}
				//判断指标是否存在
				if((json.kpiJson[0] != null && json.kpiJson[0].kpi_id == node.attributes.col_id) || (json.kpiJson[2] != null && json.kpiJson[2].kpi_id == node.attributes.col_id)){
					msginfo("您拖放的度量已存在当前图形中。")
					return;
				}
				var kpi = {"kpi_id":node.attributes.col_id, "kpi_name" : node.text, "col_name":node.attributes.col_name, "aggre":node.attributes.aggre, "tname":node.attributes.tname, "fmt":node.attributes.fmt, "alias":node.attributes.alias,"tid":json.tid,"unit":node.attributes.unit,"rate":node.attributes.rate,"calc":node.attributes.calc,"dyna":node.attributes.dyna};
				json.kpiJson[1] = kpi;
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.attributes.col_id+",'y2col','"+node.text+"')\"></span>");
				curTmpInfo.isupdate = true;
				if(json.chartJson.type == 'scatter'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null){
						chartview(json, id);
					}
				}
				if(json.chartJson.type == 'bubble'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null && json.kpiJson[2] != null){
						chartview(json, id);
					}
				}
			}
			if(node.attributes.col_type == 2 && $(this).attr("id") == "y3col"){
				if(!json.kpiJson){
					json.kpiJson = [null, null, null];
				}
				//判断指标是否存在
				if((json.kpiJson[0] != null && json.kpiJson[0].kpi_id == node.attributes.col_id) || (json.kpiJson[1] != null && json.kpiJson[1].kpi_id == node.attributes.col_id)){
					msginfo("您拖放的指标已存在当前图形中。")
					return;
				}
				var kpi = {"kpi_id":node.attributes.col_id, "kpi_name" : node.text, "col_name":node.attributes.col_name, "aggre":node.attributes.aggre, "tname":node.attributes.tname, "fmt":node.attributes.fmt, "alias":node.attributes.alias,"tid":json.tid,"unit":node.attributes.unit,"rate":node.attributes.rate,"calc":node.attributes.calc,"dyna":node.attributes.dyna};
				json.kpiJson[2] = kpi;
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.attributes.col_id+",'y3col','"+node.text+"')\"></span>");
				curTmpInfo.isupdate = true;
				if(json.chartJson.type == 'scatter'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null){
						chartview(json, id);
					}
				}
				if(json.chartJson.type == 'bubble'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null && json.kpiJson[2] != null){
						chartview(json, id);
					}
				}
			}
			if(node.attributes.col_type == 1 && $(this).attr("id") == "xcol"){
				//判断是否在xcol中已经存在
				if(json.chartJson.scol != undefined && json.chartJson.scol.id == node.attributes.col_id){
					msginfo("您拖放的维度已存在于图例项中，不能拖放。")
					return;
				}
				
				//判断xcol 和 scol 是否属于一个分组，如果是，不让拖动
				var gt = node.attributes.grouptype;
				if(gt != null && gt != ''){
					if(json.chartJson.scol != undefined && json.chartJson.scol.grouptype == gt){
						msginfo("您拖放的维度与此图形中已有维度分类相同，不能拖放。")
						return;
					}
				}
				
				json.chartJson.xcol = {"id":node.attributes.col_id, "dimdesc" : node.text, "type":node.attributes.dim_type, "colname":node.attributes.col,"tid":json.tid,"iscas":node.attributes.iscas, "tname":node.attributes.tname,"tableName":node.attributes.tableName, "tableColKey":node.attributes.tableColKey,"tableColName":node.attributes.tableColName, "dimord":node.attributes.dimord, "dim_name":node.attributes.dim_name, "grouptype":node.attributes.grouptype,"dyna":node.attributes.dyna,"ord":node.attributes.ord};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.attributes.col_id+",'xcol', '"+node.text+"')\"></span>");
				curTmpInfo.isupdate = true;
				if(json.chartJson.type == 'scatter'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null){
						chartview(json, id);
					}
				}
				if(json.chartJson.type == 'bubble'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null && json.kpiJson[2] != null){
						chartview(json, id);
					}
				}
			}
			if(node.attributes.col_type == 1 && $(this).attr("id") == "scol"){
				//判断是否在xcol中已经存在
				if(json.chartJson.xcol != undefined && json.chartJson.xcol.id == node.attributes.col_id){
					msginfo("您拖放的维度已存在于横轴中，不能拖放。")
					return;
				}
				
				//判断xcol 和 scol 是否属于一个分组，如果是，不让拖动
				var gt = node.attributes.grouptype;
				if(gt != null && gt != ''){
					if(json.chartJson.xcol != undefined && json.chartJson.xcol.grouptype == gt){
						msginfo("您拖放的维度与此图形中已有维度分类相同，不能拖放。")
						return;
					}
				}
				
				json.chartJson.scol = {"id":node.attributes.col_id, "dimdesc" : node.text, "type":node.attributes.dim_type, "colname":node.attributes.col,"tid":json.tid,"iscas":node.attributes.iscas, "tname":node.attributes.tname, "tableName":node.attributes.tableName, "tableColKey":node.attributes.tableColKey,"tableColName":node.attributes.tableColName, "dimord":node.attributes.dimord, "dim_name":node.attributes.dim_name, "grouptype":node.attributes.grouptype,"dyna":node.attributes.dyna,"ord":node.attributes.ord};
				$(this).html("<span class=\"charttxt\">" + node.text + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this,"+node.attributes.col_id+", 'scol', '"+node.text+"')\"></span>");
				curTmpInfo.isupdate = true;
				if(json.chartJson.type == 'scatter'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null){
						chartview(json, id);
					}
				}
				if(json.chartJson.type == 'bubble'){
					if(json.kpiJson[0] != null && json.kpiJson[1] != null && json.kpiJson[2] != null){
						chartview(json, id);
					}
				}
			}
		}
	});
}
//回写横轴、纵轴、图例等内容
function backChartData(comp){
	var id = comp.id;
	if(!$.isEmptyObject(comp.chartJson.xcol)){
		var node = comp.chartJson.xcol;
		$("#T" + id + " #xcol").html("<span class=\"charttxt\">" + node.dimdesc + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.id+",'xcol', '"+node.dimdesc+"')\"></span>");
	}
	if(!$.isEmptyObject(comp.chartJson.ycol)){
		var node = comp.kpiJson[0];
		$("#T" + id + " #ycol").html("<span class=\"charttxt\">" + node.kpi_name + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.kpi_id+",'ycol','"+node.kpi_name+"')\"></span>");
	}
	/**
	气泡图3个指标，散点图两个指标
	**/
	//回写y2
	if(comp.kpiJson && (comp.chartJson.type == 'scatter' || comp.chartJson.type == 'bubble')){
		var node = comp.kpiJson[1];
		if(node != null){
			$("#T" + id + " #y2col").html("<span class=\"charttxt\">" + node.kpi_name + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.kpi_id+",'y2col','"+node.kpi_name+"')\"></span>");
		}
		
		//回写y3
		node = comp.kpiJson[2];
		if(node != null){
			$("#T" + id + " #y3col").html("<span class=\"charttxt\">" + node.kpi_name + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.kpi_id+",'y3col','"+node.kpi_name+"')\"></span>");
		}
	}
	if(!$.isEmptyObject(comp.chartJson.scol)){
		if(comp.chartJson.type != 'pie' && comp.chartJson.type != 'gauge'){
			var node = comp.chartJson.scol;
			$("#T" + id + " #scol").html("<span class=\"charttxt\">" + node.dimdesc + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this,"+node.id+", 'scol', '"+node.dimdesc+"')\"></span>");
		}
	}
}

function chartmenu(ts, id, tp, name){
	var offset = $(ts).offset();
	//放入临时对象中，方便下次获取
	curTmpInfo.ckid = id;
	curTmpInfo.tp = tp;
	curTmpInfo.compId = $(ts).parents(".comp_table").attr("id").replace("T","");
	curTmpInfo.dimname = name;
	
	if(tp == 'ycol' || tp == 'y2col' || tp=='y3col'){
		$("#chartoptmenu").menu("enableItem", $("#m_set"));
	}else{
		$("#chartoptmenu").menu("disableItem", $("#m_set"));
	}
	$("#chartoptmenu").menu("show", {left:offset.left, top:offset.top + 20});
}
function chartsort(sorttp){
	var tp = curTmpInfo.tp;
	var compId = curTmpInfo.compId;
	var id = curTmpInfo.ckid;
	var json = findCompById(compId);
	
	if(tp == 'xcol'){
		//清除指标排序,因为指标排序最优先
		delete json.kpiJson[0].sort;
		json.chartJson.xcol.dimord = sorttp;
	}
	if(tp == 'ycol'){
		json.kpiJson[0].sort = sorttp;
	}
	if(tp == 'scol'){
		//清除指标排序
		delete json.kpiJson[0].sort;
		json.chartJson.scol.dimord = sorttp;
	}
	curTmpInfo.isupdate = true;
	chartview(json, compId);
}
function delChartKpiOrDim(){
	var tp = curTmpInfo.tp;
	var compId = curTmpInfo.compId;
	var id = curTmpInfo.ckid;
	var json = findCompById(compId);
	
	if(tp == 'xcol'){
		json.chartJson.xcol = {};
		$("#T"+compId+" #xcol").html("<span class=\"charttip\">将维度拖到这里</span>");
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
		$("#T"+compId+" #ycol").html("<span class=\"charttip\">将度量拖到这里</span>");
	}
	if(tp == 'y2col'){
		if(json.kpiJson.length > 1){
			json.kpiJson[1] = null;
		}else{
			json.kpiJson = [];
		}
		$("#T"+compId+" #y2col").html("<span class=\"charttip\">将度量拖到这里</span>");
	}
	if(tp == 'y3col'){
		json.kpiJson[2] = null;
		$("#T"+compId+" #y3col").html("<span class=\"charttip\">将度量拖到这里</span>");
	}
	if(tp == 'scol'){
		json.chartJson.scol = {};
		$("#T"+compId+" #scol").html("<span class=\"charttip\">将维度拖到这里</span>");
		curTmpInfo.isupdate = true;
		chartview(json, compId);
	}
}
/**
function formatUnit(rate){
	if(rate == 1000){
		return "千";
	}else if(rate == 10000){
		return "万";
	}else if(rate == 1000000){
		return "百万";
	}else if(rate == 100000000){
		return "亿";
	}
	return "";
}
**/
function setChartKpi(){
	var tp = curTmpInfo.tp;
	if(tp == 'xcol' || tp == 'scol'){
		return;
	}
	var dimid = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var name = curTmpInfo.dimname;
	//获取组件的JSON对象
	var comp = findCompById(compId);
	var kpi = null;
	if(tp == 'ycol'){
		kpi = comp.kpiJson[0];
	}else if(tp == 'y2col'){
		kpi = comp.kpiJson[1];
	}else if(tp == 'y3col'){
		kpi = comp.kpiJson[2];
	}
	var cube = fundCubeById(kpi.tid);
	var cubeKpi = findCubeKpiById(cube, dimid);
	var ctx = "<div class=\"textpanel\"><span class=\"inputtext\">度量名称：</span>"+kpi.kpi_name+"<br><span class=\"inputtext\">所属表/字段：</span> "+kpi.tname+" / "+kpi.col_name+"<br><span class=\"inputtext\">度量单位：</span><select id=\"kpiunit\" name=\"kpiunit\" class=\"inputform2\"><option value='1'></option><option value='1000'>千</option><option value='10000'>万</option><option value='1000000'>百万</option><option value='100000000'>亿</option></select>"+(kpi.unit?kpi.unit:"")+"<br><span class=\"inputtext\">格 式 化：</span>"+
		"<select id=\"fmt\" name=\"fmt\" class=\"inputform2\"><option value=\"\"></option><option value=\"###,##0\">整数</option><option value=\"###,##0.00\">小数</option><option value=\"0.00%\">百分比</option></select><br/><span class=\"inputtext\">度量解释：</span>"+(cubeKpi.kpinote?unescape(cubeKpi.kpinote):"")+"</div>";
	$('#pdailog').dialog({
		title: '度量属性',
		width: 350,
		height: 245,
		closed: false,
		cache: false,
		modal: true,
		content: ctx,
		toolbar:null,
		buttons:[{
					text:'确定',
					iconCls:"icon-ok",
					handler:function(){
						kpi.fmt = $("#pdailog #fmt").val();
						kpi.rate = Number($("#pdailog #kpiunit").val());
						$('#pdailog').dialog('close');
						curTmpInfo.isupdate = true;
						chartview(comp, compId);
					}
				},{
					text:'取消',
					iconCls:"icon-cancel",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
	$("#pdailog #fmt").find("option[value='"+kpi.fmt+"']").attr("selected",true);
	$("#pdailog #kpiunit").find("option[value='"+kpi.rate+"']").attr("selected",true);
	
}
function chartfilterDims(){
	var tp = curTmpInfo.tp;
	var dimid = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var name = curTmpInfo.dimname;
	//获取组件的JSON对象
	var comp = findCompById(compId);
	var dim = null;
	if(tp == 'xcol'){
		dim = comp.chartJson.xcol;
	}else if(tp == 'scol'){
		dim = comp.chartJson.scol;
	}else{
		//指标筛选页面
		//return setChartKpi(dimid, compId, comp, name);
		return kpiFilter('chart');
	}
	var vals = [];
	if(dim.vals){
		vals = dim.vals.split(",");
	}
	var isdimExist = function(val){
		var exist = false;
		for(j=0; j<vals.length; j++){
			if(val == vals[j]){
				exist = true;
				break;
			}
		}
		return exist;
	}
	//获取dsource
	var cube = fundCubeById(dim.tid);
	var dset = findDatasetById(cube.datasetid);
	var dsource = findDatasourceById(dset.dsid);
	var ctx = "";
	var selectDim = "";
	var valStr = dim.valStrs ? dim.valStrs.split(",") : [];
	for(j=0; j<vals.length; j++){
		selectDim = selectDim + "<div class=\"checkbox checkbox-info\"><input type=\"checkbox\" id=\"S"+vals[j]+"\" name=\"dimselcet\" value=\""+vals[j]+"\" desc=\""+valStr[j]+"\"><label for=\"S"+vals[j]+"\">"+valStr[j]+"</label></div>";
	}
	ctx = "<div class=\"dxwd\"><div class=\"wdhead\">待选维度</div><input id=\"dimsearch\" style=\"width:230px;\"></input><div class=\"wdlist\" style=\"height:278px;\"></div></div><div class=\"xzwdbtn\"><button type=\"button\" id=\"xzwd\" style=\"margin-top:120px;\" title=\"选择\" class=\"btn btn-success btn-circle\">></button><br/><br/><button type=\"button\" id=\"scwd\" title=\"删除\" class=\"btn btn-success btn-circle\"><</button></div><div class=\"yxwd\"><div class=\"wdhead\">已选维度</div><div class=\"wdlist\">"+selectDim+"</div></div>";
	$('#pdailog').dialog({
		title: name + ' - 维度筛选',
		width: 546,
		height: 410,
		closed: false,
		cache: false,
		modal: true,
		content:ctx,
		buttons:[{
					text:'确定',
					iconCls:"icon-ok",
					handler:function(){
						//获取勾选值
						var vals = "";
						var valStrs = "";
						var seles = $("#pdailog input[name='dimselcet']");
						seles.each(function(a, b){
								vals = vals + $(this).val();
								valStrs = valStrs + $(this).attr("desc");
								if(a != seles.size() - 1){
								   vals = vals + ',';
								   valStrs = valStrs + ",";
								}
						});
						dim.vals = vals;
						dim.valStrs = valStrs;
						curTmpInfo.isupdate = true;
						chartview(comp, compId);
						$('#pdailog').dialog('close');
					}
				},{
					text:'取消',
					iconCls:"icon-cancel",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
	//加载维度数据
	if(dim.tableColKey == '' || dim.tableName == '' || dim.tableColName == ''){
		loadDimFunc2(cube, dsource, dim, ""); 
	}else{
		loadDimFunc(cube, dsource, dim, "");
	}
	//注册维度选择事件
	$("#pdailog #xzwd").click(function(){
		var ls = $("#pdailog input[name='dimselcet']");
		var isExist = function(val){
			var exist =false;
			for(i=0;i<ls.size(); i++){
				if($(ls.get(i)).val() == val){
					exist = true;
					break;
				}
			}
			return exist;
		}
		$("#pdailog input[name='dimval']:checkbox:checked").each(function(index, element) {
			if(!isExist($(element).val())){
				var str = "<div class=\"checkbox checkbox-info\"><input type=\"checkbox\" desc=\""+$(element).attr("desc")+"\" value=\""+$(element).val()+"\" name=\"dimselcet\" id=\"S"+$(element).val()+"\"><label for=\"S"+$(element).val()+"\">"+$(element).attr("desc")+"</label></div>";
				$("#pdailog .yxwd .wdlist").append(str);
			}
        });
	});
	//注册维度删除事件
	$("#pdailog #scwd").click(function(){
		$("#pdailog input[name='dimselcet']:checkbox:checked").each(function(index, element) {
            $(element).parent().remove();
        });
	});
	//搜索按钮
	$("#pdailog #dimsearch").searchbox({
		searcher:function(value,name){
			if(dim.tableName == '' || dim.tableColKey == '' || dim.tableColName == ''){
				loadDimFunc2(dsource, dim, value);
			}else{
				loadDimFunc(dsource, dim, value);
			}
		},
		prompt:'维度搜索...'
	});
}
function exchangexs(compId, islink){
	var comp = findCompById(compId);
	if(comp.chartJson == undefined || (comp.chartJson.xcol == undefined && comp.chartJson.scol == undefined)){
		msginfo("您还未选择维度。");
	}
	var tmp = comp.chartJson.xcol;
	comp.chartJson.xcol = comp.chartJson.scol;
	comp.chartJson.scol = tmp;
	
	//更新显示内容
	if(comp.chartJson.xcol && comp.chartJson.xcol.id){	
		var node = comp.chartJson.xcol;
		$("#T" + compId + " #xcol").html("<span class=\"charttxt\">" + (node.dimdesc ? node.dimdesc : "") + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.id+",'xcol', '"+node.dimdesc+"')\"></span>");
	}else{
		$("#T"+compId+" #xcol").html("<span class=\"charttip\">将维度拖到这里</span>");
	}
	if(comp.chartJson.scol && comp.chartJson.scol.id){	
		var node = comp.chartJson.scol;
		$("#T" + compId + " #scol").html("<span class=\"charttxt\">" + (node.dimdesc ? node.dimdesc : "") + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.id+",'scol', '"+node.dimdesc+"')\"></span>");
	}else{
		$("#T"+compId+" #scol").html("<span class=\"charttip\">将维度拖到这里</span>");
	}
	curTmpInfo.isupdate = true;
	chartview(comp, compId);
	
	//判断图形是否有联动
	if(comp.complink && islink){
		var tableComp = findCompById(comp.complink);
		if(tableComp != null && isSameDimsInDrill(tableComp, comp)){ //必须维度相同才能联动。
			curTmpInfo.compId = "T" + tableComp.id;
			changecolrow(false);
		}
	}
}

/**
 * 格式化数字显示方式 
 * 用法
 * formatNumber(12345.999,'#,##0.00');
 * formatNumber(12345.999,'#,##0.##');
 * formatNumber(123,'000000');
 * @param num
 * @param pattern
 */
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
function crtChartfromTab(){
	var compId = curTmpInfo.compId.replace("T", "");
	var comp = findCompById(compId);
	var rows = "";
	for(i=0; i<comp.tableJson.rows.length; i++){
		var selected = "";
		if(i == comp.tableJson.rows.length - 1){
			selected = "selected";
		}
		rows = rows + "<option value='"+comp.tableJson.rows[i].id+"' "+selected+">"+comp.tableJson.rows[i].dimdesc+"</option>";
	}
	var cols = "";
	for(i=0; i<comp.tableJson.cols.length; i++){
		var selected = "";
		if(i == comp.tableJson.cols.length - 1){
			selected = "selected";
		}
		cols = cols + "<option value='"+comp.tableJson.cols[i].id+"' "+selected+">"+comp.tableJson.cols[i].dimdesc+"</option>";
	}
	var ctx = "<div style='line-height:25px; margin:5px;'>类型：<select id='charttype'><option value='line'>曲线图</option><option value='column'>柱状图</option><option value='pie'>饼图</option><option value='radar'>雷达图</option></select><br>横轴：<select id='hz'>"+rows+"</select><br/>图例：<select id='zz'>"+cols+"</select></div>";
	$('#pdailog').dialog({
		title: '通过表格数据生成图形',
		width: 220,
		height: 200,
		closed: false,
		cache: false,
		modal: true,
		content:ctx,
		toolbar:null,
		buttons:[{
					text:'确定',
					iconCls:'icon-ok',
					handler:function(){
						var tp = $("#charttype").val();
						var xcol = $("#hz").val();
						var scol = $("#zz").val();
						var kpi = curTmpInfo.ckid;
						$('#pdailog').dialog('close');
						var chart = {id:getMaxCompId(), name:"图形组件", type:"chart", chartJson:{type:tp,ycol:{type:"kpi"}, params:[]}, tid:comp.tid, tname:comp.tname, ttype:comp.ttype,kpiJson:[],complink:comp.id};
						comp.complink = chart.id; //设置表格和图形的联动
						//设置指标
						var k = eval("(" + JSON.stringify(findKpiById(kpi, comp.kpiJson)) + ")");
						chart.kpiJson.push(k);
						//设置x,ser
						if(xcol != null && xcol != ''){
							chart.chartJson.xcol = eval("(" + JSON.stringify(findDimById(xcol, comp.tableJson.rows)) + ")");
						}
						if(scol != null && scol != ''){
							chart.chartJson.scol = eval("(" + JSON.stringify(findDimById(scol, comp.tableJson.cols)) + ")");
						}
						//设置参数维
						/**
						for(k=0; k<comp.tableJson.rows.length; k++){
							if(comp.tableJson.rows[k].id == xcol || comp.tableJson.rows[k].id == scol){
							}else{
								chart.chartJson.params.push(comp.tableJson.rows[k]);
							}
						}
						for(k=0; k<comp.tableJson.cols.length; k++){
							if(comp.tableJson.cols[k].id == xcol || comp.tableJson.cols[k].id == scol){
							}else{
								chart.chartJson.params.push(comp.tableJson.cols[k]);
							}
						}
						**/
						curTmpInfo.isupdate = true;
						curTmpInfo.charttype = tp;
						addComp(chart.id, chart.name, null, false, chart.type, chart);
						//添加到组件
						pageInfo.comps.push(chart);
						//设置滚动条位置sss
						var p = $("#T"+chart.id).offset();
						$("#optarea").scrollTop(p.top);
					}
				},{
					text:'取消',
					iconCls:'icon-cancel',
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
}
