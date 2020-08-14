var custom_settings = <% get_custom_settings(); %>;

var $j = jQuery.noConflict(); //avoid conflicts on John's fork (state.js)

var maxNoCharts = 0;
var currentNoCharts = 0;

var ShowLines = GetCookie("ShowLines","string");
var ShowFill = GetCookie("ShowFill","string");
if( ShowFill == "" ){
	ShowFill = "origin";
}

var DragZoom = true;
var ChartPan = false;

Chart.defaults.global.defaultFontColor = "#CCC";
Chart.Tooltip.positioners.cursor = function(chartElements, coordinates) {
	return coordinates;
};

var chartlist = ["daily","weekly","monthly"];
var timeunitlist = ["hour","day","day"];
var intervallist = [24,7,30];
var bordercolourlist = ["#fc8500","#42ecf5"];
var backgroundcolourlist = ["rgba(252,133,0,0.5)","rgba(66,236,245,0.5)"];

function keyHandler(e) {
	if (e.keyCode == 27){
		$j(document).off("keydown");
		ResetZoom();
	}
}

$j(document).keydown(function(e){keyHandler(e);});
$j(document).keyup(function(e){
	$j(document).keydown(function(e){
		keyHandler(e);
	});
});

function Draw_Chart_NoData(txtchartname){
	document.getElementById("divLineChart_"+txtchartname).width="730";
	document.getElementById("divLineChart_"+txtchartname).height="500";
	document.getElementById("divLineChart_"+txtchartname).style.width="730px";
	document.getElementById("divLineChart_"+txtchartname).style.height="500px";
	var ctx = document.getElementById("divLineChart_"+txtchartname).getContext("2d");
	ctx.save();
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = "normal normal bolder 48px Arial";
	ctx.fillStyle = 'white';
	ctx.fillText('No data to display', 365, 250);
	ctx.restore();
}

function Draw_Chart(txtchartname){
	var chartperiod = getChartPeriod($j("#" + txtchartname + "_Period option:selected").val());
	var txtunity = "Mbps";
	var txtunitx = timeunitlist[$j("#" + txtchartname + "_Period option:selected").val()];
	var numunitx = intervallist[$j("#" + txtchartname + "_Period option:selected").val()];
	var dataobject = window[chartperiod+"_"+txtchartname];
	if(typeof dataobject === 'undefined' || dataobject === null) { Draw_Chart_NoData(txtchartname); return; }
	if (dataobject.length == 0) { Draw_Chart_NoData(txtchartname); return; }
	
	//var chartLabels = dataobject.map(function(d) {return d.Metric});
	var chartData = dataobject.map(function(d) {return {x: d.Time, y: d.Value}});
	
	var unique = [];
	var chartTrafficTypes = [];
	for( let i = 0; i < dataobject.length; i++ ){
		if( !unique[dataobject[i].Metric]){
			chartTrafficTypes.push(dataobject[i].Metric);
			unique[dataobject[i].Metric] = 1;
		}
	}
	
	var chartDataDownload = dataobject.filter(function(item) {
		return item.Metric == "Download";
	}).map(function(d) {return {x: d.Time, y: d.Value}});
	
	var chartDataUpload = dataobject.filter(function(item) {
		return item.Metric == "Upload";
	}).map(function(d) {return {x: d.Time, y: d.Value}});
	
	var objchartname=window["LineChart_"+txtchartname];
	
	var timeaxisformat = getTimeFormat($j("#Time_Format option:selected").val(),"axis");
	var timetooltipformat = getTimeFormat($j("#Time_Format option:selected").val(),"tooltip");
	
	factor=0;
	if (txtunitx=="hour"){
		factor=60*60*1000;
	}
	else if (txtunitx=="day"){
		factor=60*60*24*1000;
	}
	if (objchartname != undefined) objchartname.destroy();
	var ctx = document.getElementById("divLineChart_"+txtchartname).getContext("2d");
	var lineOptions = {
		segmentShowStroke : false,
		segmentStrokeColor : "#000",
		animationEasing : "easeOutQuart",
		animationSteps : 100,
		maintainAspectRatio: false,
		animateScale : true,
		hover: { mode: "point" },
		legend: {
			display: true,
			position: "top",
			reverse: true,
			onClick: function (e, legendItem) {
				var index = legendItem.datasetIndex;
				var ci = this.chart;
				var meta = ci.getDatasetMeta(index);
				
				meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
				
				if( ShowLines == "line" ){
					var annotationline = ""
					if(meta.hidden != true){
						annotationline = "line";
					}
					
					if ( index == 0 ){
						for (aindex = 3; aindex < 6; aindex++) {
							ci.options.annotation.annotations[aindex].type=annotationline;
						}
					}
					else if (index == 1){
						for (aindex = 0; aindex < 3; aindex++) {
							ci.options.annotation.annotations[aindex].type=annotationline;
						}
					}
				}
					
				ci.update();
			}
		},
		title: { display: true, text: "Bandwidth" },
		tooltips: {
			callbacks: {
					title: function (tooltipItem, data) { return (moment(tooltipItem[0].xLabel,"X").format(timetooltipformat)); },
					label: function (tooltipItem, data) { return round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y,2).toFixed(2) + ' ' + txtunity;}
				},
			itemSort: function(a, b) {
				return b.datasetIndex - a.datasetIndex;
			},
			mode: 'x',
			position: 'nearest',
			intersect: false
		},
		scales: {
			xAxes: [{
				type: "time",
				gridLines: { display: true, color: "#282828" },
				ticks: {
					min: moment().subtract(numunitx, txtunitx+"s"),
					display: true
				},
				time: {
					parser: "X",
					unit: txtunitx,
					stepSize: 1,
					displayFormats: timeaxisformat
				}
			}],
			yAxes: [{
				gridLines: { display: false, color: "#282828" },
				scaleLabel: { display: false, labelString: "" },
				ticks: {
					display: true,
					beginAtZero: true,
					callback: function (value, index, values) {
						return round(value,2).toFixed(2) + ' ' + txtunity;
					}
				},
			}]
		},
		plugins: {
			zoom: {
				pan: {
					enabled: ChartPan,
					mode: 'xy',
					rangeMin: {
						x: new Date().getTime() - (factor * numunitx),
						y: 0,
					},
					rangeMax: {
						x: new Date().getTime(),
						y: getLimit(chartData,"y","max",false) + getLimit(chartData,"y","max",false)*0.1,
					},
				},
				zoom: {
					enabled: true,
					drag: DragZoom,
					mode: 'xy',
					rangeMin: {
						x: new Date().getTime() - (factor * numunitx),
						y: 0,
					},
					rangeMax: {
						x: new Date().getTime(),
						y: getLimit(chartData,"y","max",false) + getLimit(chartData,"y","max",false)*0.1,
					},
					speed: 0.1
				},
			},
		},
		annotation: {
			drawTime: 'afterDatasetsDraw',
			annotations: [{
				//id: 'avgline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getAverage(chartDataDownload),
				borderColor: bordercolourlist[0],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "center",
					enabled: true,
					xAdjust: 0,
					yAdjust: 0,
					content: "Avg. Download=" + round(getAverage(chartDataDownload),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'maxline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getLimit(chartDataDownload,"y","max",true),
				borderColor: bordercolourlist[0],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "right",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Max. Download=" + round(getLimit(chartDataDownload,"y","max",true),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'minline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getLimit(chartDataDownload,"y","min",true),
				borderColor: bordercolourlist[0],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "left",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Min. Download=" + round(getLimit(chartDataDownload,"y","min",true),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'avgline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getAverage(chartDataUpload),
				borderColor: bordercolourlist[1],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "center",
					enabled: true,
					xAdjust: 0,
					yAdjust: 0,
					content: "Avg. Upload=" + round(getAverage(chartDataUpload),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'maxline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getLimit(chartDataUpload,"y","max",true),
				borderColor: bordercolourlist[1],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "right",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Max. Upload=" + round(getLimit(chartDataUpload,"y","max",true),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'minline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getLimit(chartDataUpload,"y","min",true),
				borderColor: bordercolourlist[1],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "left",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Min. Upload=" + round(getLimit(chartDataUpload,"y","min",true),2).toFixed(2)+txtunity,
				}
			}
		]}
	};
	var lineDataset = {
		datasets: getDataSets(txtchartname, dataobject, chartTrafficTypes)
	};
	objchartname = new Chart(ctx, {
		type: 'line',
		options: lineOptions,
		data: lineDataset
	});
	window["LineChart_"+txtchartname]=objchartname;
}

function getDataSets(txtchartname, objdata, objTrafficTypes) {
	var datasets = [];
	colourname="#fc8500";
	
	for(var i = 0; i < objTrafficTypes.length; i++) {
		var traffictypedata = objdata.filter(function(item) {
			return item.Metric == objTrafficTypes[i];
		}).map(function(d) {return {x: d.Time, y: d.Value}});
		
		datasets.push({ label: objTrafficTypes[i], data: traffictypedata, borderWidth: 1, pointRadius: 1, lineTension: 0, fill: true, backgroundColor: backgroundcolourlist[i], borderColor: bordercolourlist[i]});
	}
	datasets.reverse();
	return datasets;
}

function getLimit(datasetname,axis,maxmin,isannotation) {
	var limit=0;
	var values;
	if(axis == "x"){
		values = datasetname.map(function(o) { return o.x } );
	}
	else{
		values = datasetname.map(function(o) { return o.y } );
	}
	
	if(maxmin == "max"){
		limit=Math.max.apply(Math, values);
	}
	else{
		limit=Math.min.apply(Math, values);
	}
	if(maxmin == "max" && limit == 0 && isannotation == false){
		limit = 1;
	}
	return limit;
}

function getAverage(datasetname) {
	var total = 0;
	for(var i = 0; i < datasetname.length; i++) {
		total += (datasetname[i].y*1);
	}
	var avg = total / datasetname.length;
	return avg;
}

function round(value, decimals) {
	return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function ToggleLines() {
	if(interfacelist != ""){
		var interfacetextarray = interfacelist.split(',');
		if(ShowLines == ""){
			ShowLines = "line";
			SetCookie("ShowLines","line");
		}
		else {
			ShowLines = "";
			SetCookie("ShowLines","");
		}
		for (i3 = 0; i3 < interfacetextarray.length; i3++) {
			for (i4 = 0; i4 < 6; i4++) {
				window["LineChart_"+interfacetextarray[i3]].options.annotation.annotations[i4].type=ShowLines;
			}
			window["LineChart_"+interfacetextarray[i3]].update();
		}
	}
}

function ToggleFill() {
	if(interfacelist != ""){
		var interfacetextarray = interfacelist.split(',');
		if(ShowFill == "origin"){
			ShowFill = "false";
			SetCookie("ShowFill","false");
		}
		else {
			ShowFill = "origin";
			SetCookie("ShowFill","origin");
		}
		
		for (i3 = 0; i3 < interfacetextarray.length; i3++) {
			window["LineChart_"+interfacetextarray[i3]].data.datasets[0].fill=ShowFill;
			window["LineChart_"+interfacetextarray[i3]].data.datasets[1].fill=ShowFill;
			window["LineChart_"+interfacetextarray[i3]].update();
		}
	}
}

function RedrawAllCharts() {
	if(interfacelist != ""){
		var interfacetextarray = interfacelist.split(',');
		var i;
		for (i2 = 0; i2 < chartlist.length; i2++) {
			for (i3 = 0; i3 < interfacetextarray.length; i3++) {
				$j("#"+interfacetextarray[i3]+"_Period").val(GetCookie(interfacetextarray[i3]+"_Period","number"));
				//d3.csv('/ext/spdmerlin/csv/Combined'+chartlist[i2]+"_"+interfacetextarray[i3]+'.htm').then(Draw_Chart.bind(null,"Combined"+chartlist[i2]+"_"+interfacetextarray[i3],measureunitlist[i],timeunitlist[i2],intervallist[i2],bordercolourlist[i],backgroundcolourlist[i]));
				d3.csv('/ext/spdmerlin/csv/Combined'+chartlist[i2]+"_"+interfacetextarray[i3]+'.htm').then(SetGlobalDataset.bind(null,chartlist[i2]+"_"+interfacetextarray[i3]));
			}
		}
	}
}

function getTimeFormat(value,format) {
	var timeformat;
	
	if(format == "axis"){
		if (value == 0){
			timeformat = {
				millisecond: 'HH:mm:ss.SSS',
				second: 'HH:mm:ss',
				minute: 'HH:mm',
				hour: 'HH:mm'
			}
		}
		else if (value == 1){
			timeformat = {
				millisecond: 'h:mm:ss.SSS A',
				second: 'h:mm:ss A',
				minute: 'h:mm A',
				hour: 'h A'
			}
		}
	}
	else if(format == "tooltip"){
		if (value == 0){
			timeformat = "YYYY-MM-DD HH:mm:ss";
		}
		else if (value == 1){
			timeformat = "YYYY-MM-DD h:mm:ss A";
		}
	}
	
	return timeformat;
}

function GetCookie(cookiename,returntype) {
	var s;
	if ((s = cookie.get("spd_"+cookiename)) != null) {
		return cookie.get("spd_"+cookiename);
	}
	else {
		if(returntype == "string"){
			return "";
		}
		else if(returntype == "number"){
			return 0;
		}
	}
}

function SetCookie(cookiename,cookievalue) {
	cookie.set("spd_"+cookiename, cookievalue, 31);
}

function SetCurrentPage(){
	document.form.next_page.value = window.location.pathname.substring(1);
	document.form.current_page.value = window.location.pathname.substring(1);
}

function initial(){
	SetCurrentPage();
	show_menu();
	ScriptUpdateLayout();
	SetSPDStatsTitle();
	$j("#Time_Format").val(GetCookie("Time_Format","number"));
	get_conf_file();
}

function SetGlobalDataset(txtchartname,dataobject){
	window[txtchartname] = dataobject;
	currentNoCharts++;
	if(currentNoCharts == maxNoCharts) {
		if(interfacelist != ""){
			var interfacetextarray = interfacelist.split(',');
			for (i = 0; i < interfacetextarray.length; i++) {
				Draw_Chart(interfacetextarray[i]);
			}
		}
	}
}

function ScriptUpdateLayout(){
	var localver = GetVersionNumber("local");
	var serverver = GetVersionNumber("server");
	$j("#scripttitle").text($j("#scripttitle").text()+" - "+localver);
	$j("#spdmerlin_version_local").text(localver);
	
	if (localver != serverver && serverver != "N/A"){
		$j("#spdmerlin_version_server").text("Updated version available: "+serverver);
		showhide("btnChkUpdate", false);
		showhide("spdmerlin_version_server", true);
		showhide("btnDoUpdate", true);
	}
}

function reload() {
	location.reload(true);
}

function getChartPeriod(period) {
	var chartperiod = "daily";
	if (period == 0) chartperiod = "daily";
	else if (period == 1) chartperiod = "weekly";
	else if (period == 2) chartperiod = "monthly";
	return chartperiod;
}

function ResetZoom(){
	if(interfacelist != ""){
		var interfacetextarray = interfacelist.split(',');
			for (i3 = 0; i3 < interfacetextarray.length; i3++) {
				var chartobj = window["LineChart_"+interfacetextarray[i3]];
				if(typeof chartobj === 'undefined' || chartobj === null) { continue; }
				chartobj.resetZoom();
		}
	}
}

function ToggleDragZoom(button){
	var drag = true;
	var pan = false;
	var buttonvalue = "";
	if(button.value.indexOf("On") != -1){
		drag = false;
		pan = true;
		DragZoom = false;
		ChartPan = true;
		buttonvalue = "Drag Zoom Off";
	}
	else {
		drag = true;
		pan = false;
		DragZoom = true;
		ChartPan = false;
		buttonvalue = "Drag Zoom On";
	}
	
	if(interfacelist != ""){
		var interfacetextarray = interfacelist.split(',');
		for (i3 = 0; i3 < interfacetextarray.length; i3++) {
			var chartobj = window["LineChart_"+interfacetextarray[i3]];
			if(typeof chartobj === 'undefined' || chartobj === null) { continue; }
			chartobj.options.plugins.zoom.zoom.drag = drag;
			chartobj.options.plugins.zoom.pan.enabled = pan;
			button.value = buttonvalue;
			chartobj.update();
		}
	}
}

function ExportCSV() {
	location.href = "ext/spdmerlin/csv/spdmerlindata.zip";
	return 0;
}

function CheckUpdate(){
	var action_script_tmp = "start_spdmerlincheckupdate";
	document.form.action_script.value = action_script_tmp;
	var restart_time = 10;
	document.form.action_wait.value = restart_time;
	showLoading();
	document.form.submit();
}

function DoUpdate(){
	var action_script_tmp = "start_spdmerlindoupdate";
	document.form.action_script.value = action_script_tmp;
	var restart_time = 20;
	document.form.action_wait.value = restart_time;
	showLoading();
	document.form.submit();
}

function applyRule() {
	var action_script_tmp = "start_spdmerlin";
	document.form.action_script.value = action_script_tmp;
	var restart_time = 90;
	document.form.action_wait.value = restart_time;
	showLoading();
	document.form.submit();
}

function GetVersionNumber(versiontype)
{
	var versionprop;
	if(versiontype == "local"){
		versionprop = custom_settings.spdmerlin_version_local;
	}
	else if(versiontype == "server"){
		versionprop = custom_settings.spdmerlin_version_server;
	}
	
	if(typeof versionprop == 'undefined' || versionprop == null)
	{
		return "N/A";
	}
	else {
		return versionprop;
	}
}

function get_conf_file(){
	$j.ajax({
		url: '/ext/spdmerlin/interfaces.htm',
		dataType: 'text',
		error: function(xhr){
			setTimeout("get_conf_file();", 1000);
		},
		success: function(data){
			var interfaces=data.split("\n");
			interfaces.reverse();
			interfaces=interfaces.filter(Boolean);
			interfacelist="";
			var interfacecount=interfaces.length;
			for (var i = 0; i < interfacecount; i++) {
				var commentstart=interfaces[i].indexOf("#");
				if (commentstart != -1){
					continue
				}
				var interfacename=interfaces[i];
				$j("#table_buttons2").after(BuildInterfaceTable(interfacename));
				if(i == interfacecount-1){
					interfacelist+=interfacename;
				} else {
					interfacelist+=interfacename+',';
				}
			}
			
			if(interfacelist != ""){
				maxNoCharts = interfacelist.split(',').length*3;
				AddEventHandlers();
				RedrawAllCharts();
			}
		}
	});
}

function changeAllCharts(e) {
	value = e.value * 1;
	name = e.id.substring(0, e.id.indexOf("_"));
	SetCookie(e.id,value);
	if(interfacelist != ""){
		var interfacetextarray = interfacelist.split(',');
		for (i = 0; i < interfacetextarray.length; i++) {
			Draw_Chart(interfacetextarray[i]);
		}
	}
}

function changeChart(e) {
	value = e.value * 1;
	name = e.id.substring(0, e.id.indexOf("_"));
	SetCookie(e.id,value);
	Draw_Chart(name);
}

function BuildInterfaceTable(name){
	var charthtml = '<div style="line-height:10px;">&nbsp;</div>';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable" id="table_interfaces_'+name+'">';
	charthtml+='<thead class="collapsible-jquery" id="'+name+'">';
	charthtml+='<tr>';
	charthtml+='<td colspan="2">'+name+' (click to expand/collapse)</td>';
	charthtml+='</tr>';
	charthtml+='</thead>';
	charthtml+='<div class="collapsiblecontent">';
	charthtml+='<tr>';
	charthtml+='<td colspan="2" align="center" style="padding: 0px;">';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable">';
	charthtml+='<thead class="collapsible-jquery" id="resulttable_'+name+'">';
	charthtml+='<tr><td colspan="2">Last 10 speedtest results (click to expand/collapse)</td></tr>';
	charthtml+='</thead>';
	charthtml+='<div class="collapsiblecontent">';
	charthtml+='<tr>';
	charthtml+='<td colspan="2" align="center" style="padding: 0px;">';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable StatsTable">';
	var nodata="";
	var objdataname = window["DataTimestamp_"+name];
	if(typeof objdataname === 'undefined' || objdataname === null){nodata="true"}
	else if(objdataname.length == 0) {nodata="true"}
	else if(objdataname.length == 1 && objdataname[0] == "") {nodata="true"}
	
	if(nodata == "true") {
		charthtml+='<tr>';
		charthtml+='<td colspan="3" class="nodata">';
		charthtml+='No data to display';
		charthtml+='</td>';
		charthtml+='</tr>';
	} else {
		charthtml+='<col style="width:240px;">';
		charthtml+='<col style="width:240px;">';
		charthtml+='<col style="width:240px;">';
		charthtml+='<thead>';
		charthtml+='<tr>';
		charthtml+='<th class="keystatsnumber">Time</th>';
		charthtml+='<th class="keystatsnumber">Download (Mbps)</th>';
		charthtml+='<th class="keystatsnumber">Upload (Mbps)</th>';
		charthtml+='</tr>';
		charthtml+='</thead>';
		
		for(i = 0; i < objdataname.length; i++){
			charthtml+='<tr>';
			charthtml+='<td>'+moment.unix(window["DataTimestamp_"+name][i]).format('YYYY-MM-DD HH:mm:ss')+'</td>';
			charthtml+='<td>'+window["DataDownload_"+name][i]+'</td>';
			charthtml+='<td>'+window["DataUpload_"+name][i]+'</td>';
			charthtml+='</tr>';
		};
	}
	charthtml+='</table>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='</div>';
	charthtml+='</table>';
	charthtml+='<div style="line-height:10px;">&nbsp;</div>';
		
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable">';
	charthtml+='<thead class="collapsible-jquery" id="'+name+'_Chart">';
	charthtml+='<tr>';
	charthtml+='<td colspan="2">Chart (click to expand/collapse)</td>';
	charthtml+='</tr>';
	charthtml+='</thead>';
	charthtml+='<div class="collapsiblecontent">';
	charthtml+='<tr class="even">';
	charthtml+='<th width="40%">Period to display</th>';
	charthtml+='<td>';
	charthtml+='<select style="width:125px" class="input_option" onchange="changeChart(this)" id="' + name + '_Period">';
	charthtml+='<option value=0>Last 24 hours</option>';
	charthtml+='<option value=1>Last 7 days</option>';
	charthtml+='<option value=2>Last 30 days</option>';
	charthtml+='</select>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='<tr>';
	charthtml+='<td colspan="2" align="center" style="padding: 0px;">';
	charthtml+='<div style="background-color:#2f3e44;border-radius:10px;width:730px;height:500px;padding-left:5px;"><canvas id="divLineChart_'+name+'" height="500" /></div>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='</div>';
	charthtml+='</table>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='</div>';
	charthtml+='</table>';
	charthtml+='<div style="line-height:10px;">&nbsp;</div>';
	return charthtml;
}

function AddEventHandlers(){
	$j(".collapsible-jquery").click(function(){
		$j(this).siblings().toggle("fast",function(){
			if($j(this).css("display") == "none"){
				SetCookie($j(this).siblings()[0].id,"collapsed");
			}
			else {
				SetCookie($j(this).siblings()[0].id,"expanded");
			}
		})
	});
	
	$j(".collapsible-jquery").each(function(index,element){
		if(GetCookie($j(this)[0].id,"string") == "collapsed"){
			$j(this).siblings().toggle(false);
		}
		else {
			$j(this).siblings().toggle(true);
		}
	});
}