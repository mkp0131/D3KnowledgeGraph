// data 선언
const nodes = neo4jData[0].nodes;
const links = neo4jData[0].links;

// 그래프 생성
function initGraph() {
  // 상수 정의
  const WIDTH = 600;
  const HEIGHT = 600;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2;

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
    .force("center", d3.forceCenter(CENTER_X, CENTER_Y)); // 화면중앙에 뭉치기!

  // 드레그 이벤트
  const dragInteraction = d3.drag().on("drag", function (node) {
    node.fx = d3.event.x;
    node.fy = d3.event.y;

    // 좌표를 지정해준다음 simulation 재시작
    simulation.alpha(1);
    simulation.restart();
  });

  // 원본 데이터에 그래프 데이터 추가
  simulation.nodes(nodes);
  simulation.force("link").links(links);

  // 그래프 svg (컨테이너) 생성
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("class", "graph");

  // 라인 추가
  const lines = svg
    .selectAll("line") //
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#dbdbdb");

  // 노드 추가
  const circles = svg
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
  const text = svg
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
  console.log(nodes);
  console.log(links);

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

initGraph();

// ajax 로 데이터 불러오기
// $.ajax({
//   url: "./data/neo4jData.json",
//   success: function (data) {
//     initGraph(data.results);
//   },
// });
