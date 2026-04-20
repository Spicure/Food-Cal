const fetchData = async () => {
  try {
    const res = await fetch("https://www.data.gouv.fr/api/1/datasets/?q=ciqual");
    const data = await res.json();
    for (const item of data.data) {
      console.log(item.title);
      item.resources.forEach(r => console.log("  " + r.url));
    }
  } catch (e) {
    console.error(e);
  }
};
fetchData();
