// data 선언
const nodes = neo4jData[0].nodes;
const links = neo4jData[0].links;

// 그래프 생성
function initGraph(HTMLContainer) {
  // 상수 정의
  const config = {
    margin: 20, // 마진
    _width: 1000, // 전체 너비
    _height: 1000, // 전체 높이
    viewWidth: 300, // 실제적으로 유저에게 보여줄 너비(브라우저 너비)
    viewHeight: 300, // 실제적으로 유저에게 보여줄 높이(브라우저 높이)
    clippedWidth: 960, // _width - margin = 스케일 너비
    clippedHeight: 960, // _height - margin = 스케일 너비
    minimapScale: 0.3, // 미니맵 스케일
  };

  console.log(config);

  // 위치정보 미들웨어
  const trans = (x, y, k) => {
    const coord2d = `translate(${x}, ${y})`;
    if (!k) return coord2d;
    return coord2d + ` scale(${k})`;
  };
  const ttrans = (x, y, k) => ["transform", trans(x, y, k)];

  const minimapScaleX = (zoomScale) =>
    d3.scaleLinear([0, config._width], [0, config._width * zoomScale]);
  const minimapScaleY = (zoomScale) =>
    d3.scaleLinear([0, config._height], [0, config._height * zoomScale]);

  // ZOOM 관련 자표 계산
  // WARNING: *world size* should be larger than or equal to *viewport size*
  // if the world is smaller than viewport, the zoom action will yield weird coordinates.
  const worldWidth =
    config._width > config.viewWidth ? config._width : config.viewWidth;
  const worldHeight =
    config._height > config.viewHeight ? config._height : config.viewHeight;
  const zoom = d3
    .zoom()
    .scaleExtent([0.2, 1]) // smaller front, larger latter
    .translateExtent([
      [0, 0],
      [worldWidth, worldHeight],
    ]) // world extent
    .extent([
      [0, 0],
      [config.viewWidth, config.viewHeight],
    ]) // viewport extent
    .on("zoom", onZoom);

  // ZOOM 이벤트
  function onZoom() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")
      return null;
    const t = d3.event.transform;
    console.log("onZoom", d3.event);
    gCam.attr(...ttrans(t.x, t.y, t.k));
    //prevent brush invoked event

    const scaleX = minimapScaleX(t.k);
    const scaleY = minimapScaleY(t.k);

    brush.move(gBrush, [
      [scaleX.invert(-t.x), scaleY.invert(-t.y)],
      [
        scaleX.invert(-t.x + config.viewWidth),
        scaleY.invert(-t.y + config.viewHeight),
      ],
    ]);
  }

  // 미니맵 brush 이벤트
  function onBrush() {
    // prevent zoom invoked event
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom")
      return null;
    if (Array.isArray(d3.event.selection)) {
      const [[brushX, brushY], [brushX2, brushY2]] = d3.event.selection;
      const zoomScale = d3.zoomTransform(svgChart.node()).k;
      console.log("brush", {
        brushX,
        brushY,
        zoomScale,
      });

      const scaleX = minimapScaleX(zoomScale);
      const scaleY = minimapScaleY(zoomScale);

      svgChart.call(
        zoom.transform,
        d3.zoomIdentity.translate(-brushX, -brushY).scale(zoomScale)
      );
      console.log("zoom object");
      gCam.attr(...ttrans(scaleX(-brushX), scaleY(-brushY), zoomScale));
    }
  }

  // 그래프 컨테이너
  const div = d3
    .select(HTMLContainer)
    .append("div")
    .attr("class", "graph-conatainer");

  // 지식그래프
  const svgChart = div
    .append("svg")
    .attr("width", config.viewWidth)
    .attr("height", config.viewHeight)
    .attr("class", "graph");

  const gCam = svgChart.append("g").attr("class", "g_cam");

  const stageChart = gCam
    .append("g")
    .attr(...ttrans(config.margin, config.margin));

  console.log("@@@", minimapScaleX(config.minimapScale)(config._width));
  // 미니냅
  const svgMinimap = div
    .append("svg")
    // .attr("width", minimapScaleX(config.minimapScale)(config._width))
    // .attr("height", minimapScaleY(config.minimapScale)(config._height))
    .attr("width", config.viewWidth)
    .attr("height", config.viewHeight)
    .attr("viewBox", [0, 0, config._width, config._height].join(" "))
    .attr("preserveAspectRatio", "xMidYMid meet");

  svgChart.append("g").attr(...ttrans(config.margin, config.margin));

  svgMinimap
    .append("rect")
    .attr("width", config._width)
    .attr("height", config._height)
    .attr("fill", "pink");

  const stageMinimap = svgMinimap
    .append("g")
    .attr(...ttrans(config.margin, config.margin));

  const gBrush = svgMinimap.append("g");

  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [config._width, config._height],
    ])
    .on("brush", onBrush);

  // d3 시뮬레이터 정의
  const simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-500)) // 서로 밀어내는 힘
    .force(
      "link",
      d3
        .forceLink()
        .id(function (d) {
          return d.id;
        })
        .distance(function (link) {
          if (!link.distance) return 30;
          return link.distance;
        }) // 링크간의 거리 설정
    ) //  서로간의 연결 힘
    .force("center", d3.forceCenter(config._width / 2, config._height / 2)); // 화면중앙에 뭉치기!

  // 원본 데이터에 그래프 데이터 추가
  simulation.force("link").links(links);

  // 드레그 이벤트
  function stickNode(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragEnded(d) {
    if (!d3.event.active) {
      simulation.alphaTarget(0);
    }
  }

  function dragged(d) {
    stickNode(d);
  }

  function dragStarted(d) {
    if (!d3.event.active) {
      simulation.alphaTarget(0.3).restart();
    }

    d.fx = d.x;
    d.fy = d.y;
  }

  // 라인 추가
  const lines = stageChart
    .selectAll("line") //
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#dbdbdb");

  // 노드 추가
  const circles = stageChart
    .selectAll("circle") //
    .data(nodes)
    .enter()
    .append("circle")
    .attr("fill", "gray") // 원의 색상
    .attr("r", function (node) {
      if (!node.size) return 30;
      return node.size * 10;
    }) // 원의 크기
    .call(
      d3
        .drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded)
    ); // 드레그 이벤트 추가

  // 텍스트 추가
  const text = stageChart
    .selectAll("text") //
    .data(nodes)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("pointer-events", "none") // 클릭 방지 CSS 속성
    .text(function (node) {
      return node.id;
    });

  // 이벤트 추가
  svgChart.call(zoom);
  gBrush.call(brush);

  // 미니맵 브러쉬 초기화
  brush.move(gBrush, [
    [0, 0],
    [config._width * config.minimapScale, config._height * config.minimapScale],
  ]);

  // svg 기본 이벤트 제거
  svgMinimap.selectAll(".handle").remove();
  svgMinimap.selectAll(".overlay").remove();

  // 마지막에 실행되는 콜백함수(위치를 잡음)
  simulation.on("tick", function () {
    circles
      .attr("cx", function (d) {
        console.log("tx");
        return d.x;
      })
      .attr("cy", function (d) {
        return d.y;
      });

    lines
      .attr("x1", function (link) {
        return link.source.x;
      })
      .attr("y1", function (link) {
        return link.source.y;
      })
      .attr("x2", function (link) {
        return link.target.x;
      })
      .attr("y2", function (link) {
        return link.target.y;
      });

    text
      .attr("x", function (node) {
        return node.x;
      })
      .attr("y", function (node) {
        return node.y;
      });
  });
}

initGraph("#graph1");

// ajax 로 데이터 불러오기
// $.ajax({
//   url: "./data/neo4jData.json",
//   success: function (data) {
//     initGraph(data.results);
//   },
// });
