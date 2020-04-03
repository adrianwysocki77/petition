exports.fixHttp = link => {
    if (link == "") {
        return link;
    } else if (link.startsWith(" ")) {
        let empty = "";
        return empty;
    } else if (link.startsWith("http://") || link.startsWith("https://")) {
        return link;
    } else {
        let safeLink = "https://" + link;
        return safeLink;
    }
};
