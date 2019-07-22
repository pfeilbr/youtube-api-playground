require("dotenv").config();
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs-extra");
const yt = google.youtube({ version: "v3", auth: process.env.YOUTUBE_API_KEY });

const log = o => console.log(JSON.stringify(o, null, 2));
const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))
const dataPath = filename => path.resolve(__dirname, "..", "data", filename);

const searchExample = async () => {
  const resp = await yt.search.list({ part: "id,snippet", q: "ski" });
  log(resp);
};

const listVideosForChannelExample = async () => {
  const channelsListResp = await yt.channels.list({
    forUsername: "AmazonWebServices",
    part: "id,snippet"
  });
  const channel = channelsListResp.data.items[0];
  const channelId = channel.id;
  const searchListParams = {
    channelId,
    part: "id,snippet",
    order: "date",
    maxResults: 50
  };

  let count = 0;
  let searchListResp = null;
  const filePath = dataPath("channel-videos.json");
  fs.removeSync(filePath);
  do {
    log(`count: ${count}`);
    searchListResp = await yt.search.list(searchListParams);
    if (!fs.existsSync(filePath)) {
      fs.outputJSONSync(filePath, searchListResp, { spaces: "\t" });
    } else {
      const obj = fs.readJSONSync(filePath);
      obj.data.items = obj.data.items.concat(searchListResp.data.items);
      fs.outputJSONSync(filePath, obj, { spaces: "\t" });
    }
    searchListParams.nextPageToken = searchListResp.data.nextPageToken;
    count++;
    log(searchListResp);
    sleep(500)
  } while (searchListResp.data.pageInfo.totalResults > 0);

  searchListResp.data.nextPageToken;
  log(searchListResp);
};

(async () => {
  //await searchExample();
  await listVideosForChannelExample();
})();
