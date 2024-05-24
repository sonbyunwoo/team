// 스와이퍼시작
var swiper = new Swiper(".mySwiper", {
  direction: "vertical",
  slidesPerView: 1,
  spaceBetween: 30,
  mousewheel: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});
// ----------스와이퍼 끝----------

// ----------지도 시작----------
var selectedKeyword = "";

// 마커를 저장할 배열
var markers = [];

// 지도를 표시할 div와 지도 옵션 설정
var mapContainer = document.getElementById("map"),
  mapOption = {
    center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심 좌표
    level: 3, // 지도의 확대 레벨
  };

// 지도 생성
var map = new kakao.maps.Map(mapContainer, mapOption);

// 장소 검색 객체 생성
var ps = new kakao.maps.services.Places();

// 장소명을 표시할 인포윈도우 생성
var infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

// 선택된 키워드를 저장할 변수
var selectedKeyword = "";

// 키워드를 설정하고 검색창을 초기화하는 함수
function setKeyword(keyword) {
  selectedKeyword = keyword;
  document.getElementById("mainKeyword").value = ""; // 검색창 초기화
}

// 검색창의 입력값으로 장소를 검색하는 함수
function searchPlacesFromInput() {
  var inputKeyword = document.getElementById("mainKeyword").value.trim();
  if (selectedKeyword && inputKeyword) {
    var combinedKeyword = inputKeyword + " " + selectedKeyword;
    searchPlaces(combinedKeyword);
  }
}

// 키워드로 장소를 검색하는 함수
function searchPlaces(keyword) {
  if (!keyword.replace(/^\s+|\s+$/g, "")) {
    return false;
  }
  // 장소검색 객체를 통해 키워드로 장소 검색 요청
  ps.keywordSearch(keyword, placesSearchCB);
}

// 장소 검색이 완료되었을 때 호출되는 콜백 함수
function placesSearchCB(data, status, pagination) {
  if (status === kakao.maps.services.Status.OK) {
    // 검색 결과 목록과 마커를 표시
    displayPlaces(data);
    // 페이지 번호 표시
    displayPagination(pagination);
  } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
    alert("검색 결과가 존재하지 않습니다.");
  } else if (status === kakao.maps.services.Status.ERROR) {
    alert("검색 결과 중 오류가 발생했습니다.");
  }
}

// 검색 결과 목록과 마커를 표시하는 함수
function displayPlaces(places) {
  var listEl = document.getElementById("placesList"),
    menuEl = document.getElementById("menu_wrap"),
    fragment = document.createDocumentFragment(),
    bounds = new kakao.maps.LatLngBounds();

  // 검색 결과 목록에 추가된 항목 제거
  removeAllChildNods(listEl);
  // 지도에 표시된 마커 제거
  removeMarker();

  for (var i = 0; i < places.length; i++) {
    var placePosition = new kakao.maps.LatLng(places[i].y, places[i].x),
      marker = addMarker(placePosition, i),
      itemEl = getListItem(i, places[i]);

    bounds.extend(placePosition);

    // 마커와 검색 결과 항목에 mouseover/mouseout 이벤트 추가
    (function (marker, title) {
      kakao.maps.event.addListener(marker, "mouseover", function () {
        displayInfowindow(marker, title);
      });

      kakao.maps.event.addListener(marker, "mouseout", function () {
        infowindow.close();
      });

      itemEl.onmouseover = function () {
        displayInfowindow(marker, title);
      };

      itemEl.onmouseout = function () {
        infowindow.close();
      };
    })(marker, places[i].place_name);

    fragment.appendChild(itemEl);
  }

  // 검색 결과 목록에 추가
  listEl.appendChild(fragment);
  menuEl.scrollTop = 0;
  // 검색된 장소 위치를 기준으로 지도 범위 재설정
  map.setBounds(bounds);
}

// 검색 결과 항목을 Element로 반환하는 함수
function getListItem(index, places) {
  var el = document.createElement("li"),
    itemStr =
      '<span class="markerbg marker_' +
      (index + 1) +
      '"></span>' +
      '<div class="info">' +
      "   <h5>" +
      places.place_name +
      "</h5>";

  if (places.road_address_name) {
    itemStr +=
      "    <span>" +
      places.road_address_name +
      "</span>" +
      '   <span class="jibun gray">' +
      places.address_name +
      "</span>";
  } else {
    itemStr += "    <span>" + places.address_name + "</span>";
  }

  itemStr += '  <span class="tel">' + places.phone + "</span>" + "</div>";

  el.innerHTML = itemStr;
  el.className = "item";

  return el;
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수
function addMarker(position, idx) {
  var imageSrc =
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png", // 마커 이미지 url
    imageSize = new kakao.maps.Size(36, 37), // 마커 이미지 크기
    imgOptions = {
      spriteSize: new kakao.maps.Size(36, 691), // 스프라이트 이미지 크기
      spriteOrigin: new kakao.maps.Point(0, idx * 46 + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
      offset: new kakao.maps.Point(13, 37), // 마커 좌표에 일치시킬 이미지 내 좌표
    },
    markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
    marker = new kakao.maps.Marker({
      position: position,
      image: markerImage,
    });

  marker.setMap(map); // 지도 위에 마커 표시
  markers.push(marker); // 배열에 생성된 마커 추가

  return marker;
}

// 지도 위에 표시되고 있는 마커를 모두 제거하는 함수
function removeMarker() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
}

// 검색 결과 목록 하단에 페이지 번호를 표시하는 함수
function displayPagination(pagination) {
  var paginationEl = document.getElementById("pagination"),
    fragment = document.createDocumentFragment(),
    i;

  // 기존에 추가된 페이지 번호 제거
  while (paginationEl.hasChildNodes()) {
    paginationEl.removeChild(paginationEl.lastChild);
  }

  for (i = 1; i <= pagination.last; i++) {
    var el = document.createElement("a");
    el.href = "#";
    el.innerHTML = i;

    if (i === pagination.current) {
      el.className = "on";
    } else {
      el.onclick = (function (i) {
        return function () {
          pagination.gotoPage(i);
        };
      })(i);
    }

    fragment.appendChild(el);
  }
  paginationEl.appendChild(fragment);
}

// 검색 결과 목록 또는 마커를 클릭했을 때 호출되는 함수
// 인포윈도우에 장소명을 표시
function displayInfowindow(marker, title) {
  var content = '<div style="padding:5px;z-index:1;">' + title + "</div>";

  infowindow.setContent(content);
  infowindow.open(map, marker);
}

// 검색 결과 목록의 자식 Element를 제거하는 함수
function removeAllChildNods(el) {
  while (el.hasChildNodes()) {
    el.removeChild(el.lastChild);
  }
}

// 마우스가 지도 위에 있을 때 스와이퍼 스크롤 비활성화
mapContainer.addEventListener("mouseenter", function () {
  swiper.mousewheel.disable();
  swiper.allowTouchMove = false;
});

// 마우스가 지도 밖으로 나갔을 때 스와이퍼 스크롤 활성화
mapContainer.addEventListener("mouseleave", function () {
  swiper.mousewheel.enable();
  swiper.allowTouchMove = true;
});
//프로필 시작//
// var swiper = new Swiper(".mySwiper", {
//   effect: "coverflow",
//   grabCursor: true,
//   centeredSlides: true,
//   slidesPerView: "auto",
//   coverflowEffect: {
//     rotate: 50,
//     stretch: 0,
//     depth: 100,
//     modifier: 1,
//     slideShadows: true,
//   },
//   pagination: {
//     el: ".swiper-pagination",
//   },
// });
//프로필 끝
