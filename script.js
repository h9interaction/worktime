const color1 = '#0ACFD9';
const color2 = '#EF6D81';
const color3 = '#666666';
const color4 = '#FFFFFF';
const color5 = '#f3f3f3';
const color6 = '#B068FF';

let remainingMinutes;

window.onload = function () {
    makeTable();

    $('.timepicker-input').timepicker({
        'scrollDefault': 'now',
        'timeFormat': 'H:i A',
        'step': 1,
        'disableTimeRanges': [
            ['00:00 AM', '08:00 AM'],
            ['09:30 PM', '11:59 PM']
        ]
    });
    updateWorkHours();
};

var ctx = document.getElementById('workTimeChart').getContext('2d');
var workTimeChart = new Chart(ctx, {
    type: 'doughnut', // 원형 그래프 유형
    data: {
        labels: ['휴일', '근무한 시간(휴가시간 포함)', '남은 시간'],
        datasets: [{
            label: '근무 시간',
            data: [0, 2400, 0], // 여기서 첫 번째 값은 인정된 근무 시간, 두 번째 값은 남은 근무 시간(40시간 중에서)
            backgroundColor: [
                'rgba(220, 188, 256, 1)', // 휴일 색상
                'rgba(166, 232, 236, 1)', // 근무한 시간 색상
                'rgba(236, 236, 236, 1)' // 남은 시간 색상
            ],
            borderColor: [
                'rgba(255, 255, 255, 1)',
                'rgba(255, 255, 255, 1)',
                'rgba(255, 255, 255, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true, // 차트가 컨테이너 크기에 맞춰 조정됩니다.
        plugins: {
            legend: {
                display: true, // 범례 표시 설정
                position: 'bottom', // 범례의 위치
            },
            tooltip: { // Chart.js 3.x 이상에서는 tooltip을 사용
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== undefined) {
                            const value = context.parsed;
                            label += formatMinutesAsHours(value);
                        }
                        return label;
                    }
                }
            }
        }
    }
});

function updateChart(completedTime, remainingTime, vacationTime) {
    workTimeChart.data.datasets[0].data[0] = vacationTime;
    workTimeChart.data.datasets[0].data[1] = completedTime;
    workTimeChart.data.datasets[0].data[2] = remainingTime;
    workTimeChart.update();
}


function makeTable() {
    const days = ['월', '화', '수', '목', '금'];
    const titles = ['요일', '출근 시간', '퇴근 시간', '휴가 시간', '휴일 체크', '인정 시간(최대 9시간)', '적립시간'];
    const tableBody = document.getElementById('workHoursTable').getElementsByTagName('tbody')[0];
    days.forEach((day, index) => {
        let row = tableBody.insertRow();
        row.insertCell(0).innerText = day;
        row.cells[0].setAttribute('data-title', titles[0]);
        row.cells[0].classList.add('title');
        row.cells[0].style.backgroundColor = color5;
        row.cells[0].style.fontWeight = '700';
        row.classList.add('day-row');
        row.setAttribute('data-day', day);
        for (let i = 1; i <= 6; i++) { // 셀 추가로 인덱스 6까지 확장
            let cell = row.insertCell(i);
            cell.setAttribute('data-title', titles[i]);
            cell.classList.add('title');
            cell.classList.add('details');
            if (i < 3) { // 출근 시간과 퇴근 시간 입력란
                let input = document.createElement('input');
                input.type = 'text';
                input.inputMode = 'numeric';
                input.pattern = '[0-9]*';
                input.className = 'timepicker-input';

                if (i === 1) {
                    input.value = localStorage.getItem(`startTime${index + 1}`) || '';
                }
                if (i === 2) {
                    input.value = localStorage.getItem(`endTime${index + 1}`) || '';
                }
                let resetBtn = document.createElement('button');
                resetBtn.className = 'btn item-reset';
                resetBtn.textContent = 'R';
                resetBtn.onclick = () => {
                    input.value = '';
                    updateWorkHours();
                };
                cell.appendChild(input);
                cell.appendChild(resetBtn);
            } else if (i === 3) { // 휴가 시간 선택
                let select = document.createElement('select');
                ['없음', '2시간', '4시간'].forEach(option => {
                    let optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    select.appendChild(optionElement);
                });
                select.value = localStorage.getItem(`vacationTime${index + 1}`) || '없음';
                cell.appendChild(select);
            } else if (i === 4) { // 휴일 체크박스
                let label = document.createElement('label');
                label.className = 'custom-checkbox';

                let input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = localStorage.getItem(`holiday${index + 1}`) === 'true';

                let span = document.createElement('span');

                label.appendChild(input);
                label.appendChild(span);
                cell.appendChild(label);
            } else {
                cell.innerText = ''; // 나머지 셀은 초기값 설정
            }
            // if (index === 4 && i === 6)
            //     cell.style.fontWeight = '900';
        }
    });
}

function updateWorkHours() {
    const rows = document.getElementById('workHoursTable').rows;
    let totalAccumulatedMinutes = 0;

    // 휴일에 대해 빼줄 근무 시간 총합
    let totalDeductedMinutesForHolidays = 0;

    for (let i = 1; i < rows.length; i++) {
        const isHoliday = rows[i].cells[4].children[0].children[0].checked;
        rows[i].cells[0].style.color = color3;
        if (isHoliday) {
            // 휴일인 경우 전체 근무 시간에서 하루 8시간(480분)을 빼줌
            totalDeductedMinutesForHolidays += 8 * 60;
            rows[i].cells[5].innerText = '휴일(8시간 제외)'; // 휴일인 경우 근무 시간을 '휴일'로 표시
            rows[i].cells[5].style.color = color6;
            rows[i].cells[6].innerText = '';
            rows[i].cells[0].style.color = color6;
            continue;
        }

        const startTime = rows[i].cells[1].children[0].value;
        const endTime = rows[i].cells[2].children[0].value;
        const vacationTime = rows[i].cells[3].children[0].value;
        let vacationMinutes = vacationTime === '없음' ? 0 : parseInt(vacationTime) * 60;

        let workMinutes = 0;
        if (startTime && endTime) {
            const startMoment = moment(startTime, "HH:mm");
            const endMoment = moment(endTime, "HH:mm");
            if (startMoment.isValid() && endMoment.isValid()) {
                workMinutes = moment.duration(endMoment.diff(startMoment)).asMinutes();

                // 점심시간 제외
                if (!endMoment.isBefore(moment('12:30', "HH:mm")) && !startMoment.isAfter(moment('13:30', "HH:mm"))) {
                    workMinutes -= 60; // 점심시간 1시간 제외
                }
            }
        }

        // 근무 인정 시간에 휴가 시간 포함
        workMinutes += vacationMinutes;
        let dailyMaxWorkMinutes = Math.min(workMinutes, 9 * 60); // 하루 최대 근무 인정 시간 9시간으로 제한

        totalAccumulatedMinutes += dailyMaxWorkMinutes; // 휴가 시간 포함하여 누적

        let hours = Math.floor(dailyMaxWorkMinutes / 60);
        let mins = dailyMaxWorkMinutes % 60;
        rows[i].cells[5].innerText = `${pad(hours)}:${pad(mins)}`; // 근무 인정 시간 업데이트
        if (dailyMaxWorkMinutes < 480) {
            if (dailyMaxWorkMinutes === 0) {
                rows[i].cells[5].style.color = color3;
                rows[i].cells[5].style.backgroundColor = color4
            } else {
                rows[i].cells[5].style.color = color2;
                if (dailyMaxWorkMinutes < 0) {
                    rows[i].cells[5].innerText = `출퇴근시간 AM/PM 확인`;
                }
            }
        } else {
            rows[i].cells[5].style.color = color1;
        }
        // 적립시간 표시
        if (i < rows.length && dailyMaxWorkMinutes !== 0) {
            let addedTime = dailyMaxWorkMinutes - 480;
            let isMinus = false;
            if (addedTime < 0) {
                isMinus = true;
                addedTime *= -1;
            }
            let _hours = Math.floor(addedTime / 60);
            let _mins = addedTime % 60;
            if (isMinus) {
                rows[i].cells[6].innerText = `-${pad(_hours)}:${pad(_mins)} 부족`;
                rows[i].cells[6].style.color = color2;
            } else {
                if (addedTime === 0) {
                    rows[i].cells[6].style.color = color3;
                    rows[i].cells[6].innerText = '-';
                } else {
                    rows[i].cells[6].innerText = `+${pad(_hours)}:${pad(_mins)} 적립`;
                    rows[i].cells[6].style.color = color1;

                }
            }
        }
        // 기존 마지막 셀에 총 남은 근무시간 표기 없애고 챠트로 옮김!
        // else if (i < rows.length - 1 && dailyMaxWorkMinutes === 0) {
        //     rows[i].cells[6].innerText = '';
        // }
    }

    // 잔여 근무 시간 계산
    let totalRequiredMinutes = (40 * 60) - totalDeductedMinutesForHolidays; // 주당 근무 시간에서 휴일 시간을 뺀 값
    remainingMinutes = Math.max(0, totalRequiredMinutes - totalAccumulatedMinutes); // 음수 방지
    var numColor = color2;
    if (remainingMinutes > 0) {
        numColor = color2
    } else {
        numColor = color1
    }
    document.getElementById('total-remainning-time').innerHTML =
        '<div>총 잔여 근무시간' + '<span class="total-remainning-time-num" style="color: ' + numColor + '">' + formatMinutesAsHours(remainingMinutes) + '</span></div>'; // 잔여 근무 시간 업데이트

    document.getElementById('dayExitTime').innerText = '';
    updateChart(totalAccumulatedMinutes, remainingMinutes, totalDeductedMinutesForHolidays);
}

function formatMinutesAsHours(minutes) {
    let hours = Math.floor(minutes / 60);
    let mins = minutes % 60;
    return `${pad(hours)}:${pad(mins)}`;
}

function pad(number) {
    return number < 10 ? '0' + number : number.toString();
}


function saveTimeToLocalStorage() {
    const rows = document.getElementById('workHoursTable').rows;
    for (let i = 1; i < rows.length; i++) {
        const startTime = rows[i].cells[1].children[0].value;
        const endTime = rows[i].cells[2].children[0].value;
        const vacationTime = rows[i].cells[3].children[0].value;
        const isHoliday = rows[i].cells[4].children[0].children[0].checked;

        localStorage.setItem(`startTime${i}`, startTime);
        localStorage.setItem(`endTime${i}`, endTime);
        localStorage.setItem(`vacationTime${i}`, vacationTime);
        localStorage.setItem(`holiday${i}`, isHoliday);
    }
}

function resetAll() {
    const rows = document.getElementById('workHoursTable').rows;
    for (let i = 1; i < rows.length; i++) {
        localStorage.removeItem(`startTime${i}`);
        localStorage.removeItem(`endTime${i}`);
        localStorage.removeItem(`vacationTime${i}`);
        localStorage.removeItem(`holiday${i}`);

        rows[i].cells[1].children[0].value = '';
        rows[i].cells[2].children[0].value = '';
        rows[i].cells[3].children[0].value = '없음';
        rows[i].cells[4].children[0].children[0].checked = false;
        rows[i].cells[5].innerText = '00:00';
        rows[i].cells[5].style.backgroundColor = color4;
        rows[i].cells[5].style.color = color3;
        rows[i].cells[6].innerText = '';
    }
    document.getElementById('total-remainning-time').innerHTML = '<div>총 잔여 근무시간' + '<span class="total-remainning-time-num" style="color: ' + color2 + '">' + formatMinutesAsHours(remainingMinutes) + '</span></div>';
    document.getElementById('dayExitTime').innerText = '';
    updateChart(0, 2400);
}

function calculatedayExitTime() { // 금요일 뿐만 아니라 퇴근시간이 비워진 첫번째 요일의 퇴근시간도 알려주기때문에 이름을 수정해야할것같음
    var targetDayOfWeek = "";
    const table = document.getElementById('workHoursTable');
    const rows = table.rows;
    let targetRow = null;


    for (let i = 1; i < rows.length; i++) {
        if (
            rows[i].cells[2].children[0].value === '' &&
            // rows[i].cells[3].children[0].value === '없음' &&
            rows[i].cells[4].children[0].children[0].checked === false) {
            targetRow = rows[i];
            if (i === 1) {
                targetDayOfWeek = "월요일";
            } else if (i === 2) {
                targetDayOfWeek = "화요일";
            } else if (i === 3) {
                targetDayOfWeek = "수요일";
            } else if (i === 4) {
                targetDayOfWeek = "목요일";
            } else if (i === 5) {
                targetDayOfWeek = "금요일";
            }
            break;
        }
    }
    if (targetRow === null) {
        alert(`퇴근시간이 궁금한 요일의 퇴근시간을 비워주세요.`);
        return;
    }
    const startTime = targetRow.cells[1].children[0].value; // 출근 시간

    if (!startTime) {
        alert(`${targetDayOfWeek}의 출근 시간을 입력해주세요.`);
        return;
    }
    
    let remainingTotalMinutes = remainingMinutes;// (remainingHours * 60) + remainingMinutes;

    const targetdayStartMoment = moment(startTime, "HH:mm");
    const lunchStart = moment('12:30', "HH:mm");
    const lunchEnd = moment('13:30', "HH:mm");

    // 출근 시간과 남은 근무 시간을 기준으로 초기 퇴근 시간을 계산
    let tentativeTargetdayExitMoment = targetdayStartMoment.clone().add(remainingTotalMinutes, 'minutes');

    let isLaunchTime = false;
    // 점심시간이 근무 시간에 포함되어 있는지 확인 후 조정
    if (targetdayStartMoment.isBefore(lunchEnd) && tentativeTargetdayExitMoment.isAfter(lunchStart)) {
        // 점심시간이 포함되어 있으면, 퇴근 시간을 60분 연장
        remainingTotalMinutes += 60;
        isLaunchTime = true;
    }
    // 금요일이 아닌경우 휴가가 포함되어있으면 휴가시간 제외
    if (targetDayOfWeek !== "금요일") {
        const vacationTime = targetRow.cells[3].children[0].value;
        let vacationMinutes = vacationTime === '없음' ? 0 : parseInt(vacationTime) * 60;
        remainingTotalMinutes -= vacationMinutes;
    }

    // 조정된 근무 시간으로 최종 퇴근 시간 계산
    const targetdayExitMoment = targetdayStartMoment.clone().add(remainingTotalMinutes, 'minutes');

    // 퇴근 시간을 AM/PM 포맷으로 출력
    const exitTimeFormatted = targetdayExitMoment.format("hh:mm A");
    let remainingTimeFormatted = formatMinutesAsHours(remainingTotalMinutes);

    const vacationTime = targetRow.cells[3].children[0].value;
    let checkVacationMinutes = vacationTime === '없음' ? 0 : parseInt(vacationTime) * 60;
    let checkRemainingTotalMinutes = remainingTotalMinutes + checkVacationMinutes;
    if (checkRemainingTotalMinutes / 60 > 10) {
        let overWorkTime = checkRemainingTotalMinutes - 540 - 60;
        let overWorkTimeFormatted = formatMinutesAsHours(overWorkTime);
        const targetdayOverExitMoment = targetdayStartMoment.clone().add(remainingTotalMinutes - overWorkTime, 'minutes');
        const exitOverTimeFormatted = targetdayOverExitMoment.format("hh:mm A");
        document.getElementById('dayExitTime').innerHTML = `<span class="dayExitTimeNormal">${targetDayOfWeek} 근무시간을 최대한 채울 수 있는 시간(9시간)인 </span>${exitOverTimeFormatted}<span class="dayExitTimeNormal">에 퇴근하면</span><br /> 
            <span class="dayExitTimeNormal">남은 총 근무시간은</span> <span class="dayExitTimeAlert">${overWorkTimeFormatted}</span> <span class="dayExitTimeNormal">입니다.</span>`
    } else {
        document.getElementById('dayExitTime').innerHTML
            = `<span class="dayExitTimeNormal">남은 근무시간은 ${isLaunchTime ? "휴게시간 포함</span>" : "</span>"} ${remainingTimeFormatted} <br />
                <span class="dayExitTimeNormal">${targetDayOfWeek} 퇴근은</span> ${exitTimeFormatted} <span class="dayExitTimeNormal">이후부터 가능해요.</span>`;
    }
}

// Event listener to save changes and update work hours
document.getElementById('workHoursTable').addEventListener('change', (event) => {
    saveTimeToLocalStorage();
    updateWorkHours();
});