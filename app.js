// data 선언
const nodes = neo4jData[0].nodes;
const links = neo4jData[0].links;

// 그래프 생성
function initGraph(HTMLContainer) {
  if (!HTMLContainer) {
    console.log("# 그래프생성 에러: 엘리먼트가 없습니다.");
    return;
  }

  // 상수 정의
  const WIDTH = document.querySelector(HTMLContainer).clientWidth;
  const HEIGHT = document.querySelector(HTMLContainer).clientHeight;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2;

  // d3 시뮬레이터 정의
  const simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-500)) // 서로 밀어내는 힘
    .force(
      "link",
      d3
        .forceLink(links)
        .id(function (d) {
          return d.id;
        })
        .distance(function (link) {
          if (!link.distance) return 30;
          return link.distance;
        }) // 링크간의 거리 설정
    ) //  서로간의 연결 힘
    .force("center", d3.forceCenter(CENTER_X, CENTER_Y)); // 화면중앙에 뭉치기!

  // 드레그 이벤트
  const dragInteraction = d3.drag().on("drag", function (node) {
    node.fx = d3.event.x;
    node.fy = d3.event.y;

    // 좌표를 지정해준다음 simulation 재시작
    simulation.alpha(1);
    simulation.restart();
  });

  const div = d3
    .select(HTMLContainer)
    .append("div")
    .attr("class", "graph-conatainer");

  // 그래프 svg (컨테이너) 생성
  const svg = div
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("class", "graph");

  // 그래프요소 그룹으로 묶음
  const svg_inner = svg.append("g");

  // 라인 추가
  const lines = svg_inner
    .selectAll("line") //
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#dbdbdb");

  // 노드 추가
  const circles = svg_inner
    .selectAll("circle") //
    .data(nodes)
    .enter()
    .append("circle")
    .attr("fill", "gray") // 원의 색상
    .attr("r", function (node) {
      if (!node.size) return 30;
      return node.size * 10;
    }) // 원의 크기
    .call(dragInteraction); // 드레그 이벤트 추가

  // 텍스트 추가
  const text = svg_inner
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

  // 줌 이벤트 추가
  var zoom_handler = d3.zoom().on("zoom", zoom_actions);

  // 줌 이벤트
  function zoom_actions() {
    svg_inner.attr("transform", d3.event.transform);
  }

  // 줌 이벤트를 차트에 추가
  zoom_handler(svg);

  // 마지막에 실행되는 콜백함수
  simulation.on("tick", function () {
    circles
      .attr("cx", function (d) {
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
