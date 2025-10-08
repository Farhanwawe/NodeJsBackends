import React from 'react';
import ReactApexChart from 'react-apexcharts';

const PieChart = ({ data }) => {
  // Calculate the sum of all data values
  const total = data.Open + data.inProgress + data.End + data.Completed;

  // Set up the options for the pie chart
  const options = {
    labels: ['Open', 'In Progress', 'End', 'Completed'],
    plotOptions: {
      donut: {
        size: '70%', // Adjust the size of the donut to create space in the middle
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '14px', // Adjust font size for individual labels
            fontWeight: 'bold',
            colors: ['#fff'], // White text color for labels
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px', // Adjust font size for individual labels
        fontWeight: 'bold',
        colors: ['#fff'], // White text color for labels
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: '100%',
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  // Series data for the chart
  const series = [data.Open, data.inProgress, data.End, data.Completed];

  return (
    <div className="  p-6 ">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Status overview</h3>
      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        width="500"
      />
      
    </div>
  );
};

export default PieChart;
