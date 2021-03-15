//
// Generate HTML report from K6 summary data
// Ben Coleman, March 2021
//

// Have to import ejs this way, nothing else works
import ejs from "../node_modules/ejs/ejs.min.js";

// Note. Having the template here sucks, but we can't use fs or anything that can read files
const template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="https://unpkg.com/purecss@2.0.3/build/pure-min.css" crossorigin="anonymous">

    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.1/css/all.css" integrity="sha384-vp86vTRFVJgpjF9jiIGPEEqYqlDwgyBgEF109VFjmqGmIY/Y4HV4d3Gp2irVfcrp" crossorigin="anonymous">

    <link rel="shortcut icon" href="https://raw.githubusercontent.com/benc-uk/k6-reporter/main/assets/icon.png" type="image/png">

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>K6 Load Test: <%= title %></title>
    <style>
      body {
        margin: 1rem;
      }
      footer {
        float: right;
        font-size: 0.8rem;
        color: #777;
      }
      footer a {
        text-decoration: none;
        color: #777;
      }
      .failed {
        background-color: #ff6666 !important;
      }     
      .good {
        background-color: #3abe3a !important;
      }   
      td.failed {
        font-weight: bold;
      }
      h2 {
        padding-bottom: 4px;
        border-bottom: solid 3px #cccccc;
      }
      .tabs {
        display: flex;
        flex-wrap: wrap; 
      }
      .tabs label {
        order: 1; 
        display: block;
        padding: 1rem 2rem;
        margin-right: 0.2rem;
        cursor: pointer;
        color: #666;
        background: #ddd;
        font-weight: bold;
        font-size: 1.2rem;
        flex: 1 1;
        transition: background ease 0.2s;
        border-top-left-radius: 0.3rem;
        border-top-right-radius: 0.3rem;
        border-color: #ccc;
        border-style: solid;
        border-width: 2px 2px 0px;
        box-shadow: inset 0px -3px 7px -1px rgba(0,0,0,0.33);
      }
      .tabs .tab {
        order: 99;
        flex-grow: 1;
        width: 100%;
        display: none;
        padding: 1rem;
        background: #fff;
      }
      .tabs input[type="radio"] {
        display: none;
      }
      .tabs input[type="radio"]:checked + label {
        background: #fff;
        box-shadow: none;
        color: #000;
      }
      .tabs input[type="radio"]:checked + label + .tab {
        display: block;
      }
      .box {
        flex: 1 1;
        border-radius: 0.3rem;
        background-color: #3abe3a;
        margin: 1rem;
        padding: 0.5rem;
        font-size: 2vw; 
        box-shadow: 0px 4px 7px -1px rgba(0,0,0,0.49);
        color: white;
        position: relative;
        overflow: hidden;
      }
      .box h4 {
        margin: 0;
        padding-bottom: 0.5rem;
        text-align: center;
        position: relative;
        z-index: 50;
      }
      .row {
        display: flex;
      }
      .row div {
        flex: 1 1;
        text-align: center;
        margin-bottom: 0.5rem;
      }
      .bignum {
        position: relative;
        font-size: min(6vw, 80px);
        z-index: 20;
      }
      table {
        font-size: min(2vw, 22px);
        width: 100%;
      }
      .icon { 
        position: absolute;
        top: 60%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #0000002d;
        font-size: 9vw;
        z-index: 1;
      }
      .metricbox {
        background-color: #5697e2;
        font-size: 3vw;
        height: auto;
      }
      .metricbox .row {
        position: relative;
        z-index: 20;
      }
    </style>
  </head>

  <body>
    <h1>
      <svg style="vertical-align:middle" width="50" height="45" viewBox="0 0 50 45" fill="none" class="footer-module--logo--_lkxx"><path d="M31.968 34.681a2.007 2.007 0 002.011-2.003c0-1.106-.9-2.003-2.011-2.003a2.007 2.007 0 00-2.012 2.003c0 1.106.9 2.003 2.012 2.003z" fill="#7D64FF"></path><path d="M39.575 0L27.154 16.883 16.729 9.31 0 45h50L39.575 0zM23.663 37.17l-2.97-4.072v4.072h-2.751V22.038l2.75 1.989v7.66l3.659-5.014 2.086 1.51-3.071 4.21 3.486 4.776h-3.189v.001zm8.305.17c-2.586 0-4.681-2.088-4.681-4.662 0-1.025.332-1.972.896-2.743l4.695-6.435 2.086 1.51-2.239 3.07a4.667 4.667 0 013.924 4.6c0 2.572-2.095 4.66-4.681 4.66z" fill="#7D64FF"></path></svg> 
      &nbsp; K6 Load Test: <%= title %>
    </h1>

    <div class="row">
      <div class="box">
        <i class="fas fa-globe icon"></i>
        <h4>Requests</h4>
        <% if(data.metrics.http_reqs) { %><div class="bignum"><%= data.metrics.http_reqs.values.count %></div><% } %>
      </div>
      <div class="box <% if(thresholdFailures > 0) { %> failed <% } %>">
        <i class="fas fa-chart-bar icon"></i>
        <h4>Breached Thresholds</h4>
        <div class="bignum"><%= thresholdFailures %></div>
      </div>
      <div class="box <% if(checkFailures > 0) { %> failed <% } %>">
        <i class="fas fa-eye icon"></i>
        <h4>Failed Checks</h4>
        <div class="bignum"><%= checkFailures %></div>
      </div>
    </div>

    <br>
    
    <div class="tabs">
      <input type="radio" name="tabs" id="tabone" checked="checked">
      <label for="tabone"><i class="far fa-clock"></i> &nbsp; Request Metrics</label>
      <div class="tab">
        <table class="pure-table pure-table-striped">
          <tbody>
            <thead>
              <tr>
                <th></th>
                <th>Average</th>
                <th>Maximum</th>
                <th>Median</th> 
                <th>Minimum</th>
                <th>90th Percentile</th>
                <th>95th Percentile</th>
              </tr>
            </thead>
            
            <% function checkFailed(metric, valName) {
                if(!metric.thresholds) return ''
                for(thres in metric.thresholds) {
                  if(thres.includes(valName)) {
                    if(!metric.thresholds[thres].ok) return 'failed'
                    return 'good'
                  }
                }
              }

              for(metricName of metricListSorted) { 
                var metric = data.metrics[metricName] 
                if(!metric.values.avg) { continue }
                if(metricName.includes("{")) { continue } %>
              <tr>
                <td><%= metricName %></td>
                <td class="<%= checkFailed(metric, 'avg') %>"><%= metric.values.avg.toFixed(2) %></td>
                <td class="<%= checkFailed(metric, 'max') %>"><%= metric.values.max.toFixed(2) %></td>
                <td class="<%= checkFailed(metric, 'med') %>"><%= metric.values.meds.toFixed(2) %></td>
                <td class="<%= checkFailed(metric, 'min') %>"><%= metric.values.min.toFixed(2) %></td>
                <td class="<%= checkFailed(metric, 'p(90)') %>"><%= metric.values['p(90)'].toFixed(2) %></td>
                <td class="<%= checkFailed(metric, 'p(95)') %>"><%= metric.values['p(95)'].toFixed(2) %></td>
              </tr>
            <% } %>
          </tbody>
        </table>
        <br>
        &nbsp;&nbsp; Note. All times are in milli-seconds
      </div> 
      <!-- ---- end tab ---- -->

      <input type="radio" name="tabs" id="tabtwo">
      <label for="tabtwo"><i class="fas fa-chart-line"></i> &nbsp; Other Stats</label>
      <div class="tab">
        <div class="row">
          <% if (data.metrics.checks) { %>
            <div class="box metricbox">
              <h4>Checks</h4>
              <i class="fas fa-eye icon"></i>
              <div class="row"><div>Passed</div><div><%= data.metrics.checks.values.passes %></div></div>
              <div class="row"><div>Failed</div><div><%= data.metrics.checks.values.fails %></div></div>
            </div>
          <% } %>

          <div class="box metricbox">
            <h4>Iterations</h4>
            <i class="fas fa-redo icon"></i>
            <div class="row"><div>Total</div><div><%= data.metrics.iterations.values.count %></div></div>
            <div class="row"><div>Rate</div><div><%= data.metrics.iterations.values.rate.toFixed(2) %>/s</div></div>
          </div>

          <div class="box metricbox">
            <h4>Virtual Users</h4>
            <i class="fas fa-user icon"></i>
            <div class="row"><div>Min</div><div><%= data.metrics.vus.values.min %></div></div>
            <div class="row"><div>Max</div><div><%= data.metrics.vus.values.max %></div></div>
          </div>
        </div>

        <div class="row">
          <div class="box metricbox">
            <h4>Requests</h4>
            <i class="fas fa-globe icon"></i>
            <div class="row"><div>Total</div><div><% if(data.metrics.http_reqs) { %><%= data.metrics.http_reqs.values.count %><% } %></div></div>
            <div class="row"><div>Rate</div><div><% if(data.metrics.http_reqs) { %><%= data.metrics.http_reqs.values.rate.toFixed(2) %>/s<% } %></div></div>
          </div>

          <div class="box metricbox">
            <h4>Data Received</h4>
            <i class="fas fa-cloud-download-alt icon"></i>
            <div class="row"><div>Total</div><div><%= (data.metrics.data_received.values.count/1000000).toFixed(2) %> MB</div></div>
            <div class="row"><div>Rate</div><div><%= (data.metrics.data_received.values.rate/1000000).toFixed(2) %> mB/s</div></div>
          </div>

          <div class="box metricbox">
            <h4>Data Sent</h4>
            <i class="fas fa-cloud-upload-alt icon"></i>
            <div class="row"><div>Total</div><div><%= (data.metrics.data_sent.values.count/1000000).toFixed(2) %> MB</div></div>
            <div class="row"><div>Rate</div><div><%= (data.metrics.data_sent.values.rate/1000000).toFixed(2) %> mB/s</div></div>
          </div>   
        </div>
      </div>  
      <!-- ---- end tab ---- -->     

      <input type="radio" name="tabs" id="tabthree">
      <label for="tabthree"><i class="fas fa-tasks"></i> Checks & Groups</label>
      <div class="tab">

        <% for(group of data.root_group.groups) { %>
          <h2>&bull; <%= group.name %></h2>
          <table class="pure-table pure-table-horizontal" style="width: 100%">
            <thead>
              <tr>
                <th>Check Name</th>
                <th>Passes</th>
                <th>Failures</th>
              </tr>
            </thead>
            <% for(check of group.checks) { %>
              <tr class="checkDetails <% if(check.fails > 0) { %>failed<% } %>"><td width="50%"><%= check.name %></td><td><%= check.passes %></td><td><%= check.fails %></td></tr>
            <% } %>
          </table>
          <br>
        <% } %>

        <h2>&bull; Other Checks</h2>
        <table class="pure-table pure-table-horizontal" style="width: 100%">
          <thead>
            <tr>
              <th>Check Name</th>
              <th>Passes</th>
              <th>Failures</th>
            </tr>
          </thead>
          <% for(check of data.root_group.checks) { %>
            <tr class="checkDetails <% if(check.fails > 0) { %>failed<% } %>"><td width="50%"><%= check.name %></td><td><%= check.passes %></td><td><%= check.fails %></td></tr>
          <% } %>
        </table>     
      </div> 
      <!-- ---- end tab ---- -->
    </div>
  </body>
</html>
`;
const version = "0.0.1";

//
// Main function should be imported and wrapped with the function handleSummary
//
// prettier-ignore
export function htmlReport(data, opts = {filename: "summary.html", title: new Date().toISOString().slice(0, 16).replace("T", " ")}) {
  console.log(`[k6-reporter v${version}] Generating HTML summary report as: ${opts.filename}`)
  let metricListSorted = []

  // Count the thresholds and those that have failed
  let thresholdFailures = 0;
  let thresholdCount = 0;
  for (let metricName in data.metrics) {
    metricListSorted.push(metricName)
    if (data.metrics[metricName].thresholds) {
      thresholdCount++;
      let thresholds = data.metrics[metricName].thresholds;
      for (let t in thresholds) {
        if (!thresholds[t].ok) thresholdFailures++;
      }
    }
  }
  
  // Sorted list used for reporting in order
  metricListSorted.sort()

  // Count the checks and those that have passed or failed
  // NOTE. Nested groups are not checked!
  let checkFailures = 0;
  let checkPasses = 0;
  if (data.root_group.checks) {
    let { passes, fails } = countChecks(data.root_group.checks);
    checkFailures += fails;
    checkPasses += passes;
  }

  for (let group of data.root_group.groups) {
    if (group.checks) {
      let { passes, fails } = countChecks(group.checks);
      checkFailures += fails;
      checkPasses += passes;
    }
  }

  // Render the template
  const html = ejs.render(template, {
    data,
    title: opts.title,
    metricListSorted,
    thresholdFailures,
    thresholdCount,
    checkFailures,
    checkPasses,
  });

  // Return a handleSummary result object
  // See https://k6.io/docs/results-visualization/end-of-test-summary#handlesummary-callback
  let result = {};
  result[opts.filename] = html;
  return result;
}

//
// Helper for counting the checks in a group
//
function countChecks(checks) {
  let passes = 0;
  let fails = 0;
  for (let check of checks) {
    passes += parseInt(check.passes);
    fails += parseInt(check.fails);
  }
  return { passes, fails };
}