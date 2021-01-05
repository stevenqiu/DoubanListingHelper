console.log('content script starts');

// ====== Utilities ======

let getCurrentPage=()=>{
    let match=window.location.href.match(/([\w]+)\.com/);
    let site=match && match[1];
    let page;

    switch(site){
        case 'douban':
            let nBasic=document.getElementsByClassName('basic').length;
            if (nBasic==2) page='douban-1';
            else if (nBasic>2) page='douban-2';
            else page='douban-3';
            break;
        case 'bandcamp':
        case 'discogs':
        case 'soundcloud':
        case 'apple':
        case 'spotify':    
            page=site;
            break;
    }
    return page
}

const localStorageId='DoubanListingMetadata'

// ====== Douban ====== 

let fillDropdown=(dropdown, value, valueIndexMap)=>{
    let i=valueIndexMap[value];
    console.log(i);
    if (i || i==0) dropdown.getElementsByClassName('options')[0].getElementsByClassName('sub')[i].click();
}

// douban listing page 1
let fillDouban1=(meta, click=false) =>{                              
    document.getElementById('p_title').value=meta['album']; // album
    let button;
    if (meta['barcode']){
        console.log('have barcode');
        document.getElementById('uid').value=meta['barcode']; //barcode
        button=document.getElementsByClassName('submit')[0];
    } else{
        button=document.getElementsByClassName('btn-link')[0];
    }
    if (click) button.click(); 
}

// douban listing page 2
let fillDouban2=(meta,click=false) =>{
    document.getElementsByClassName('item basic')[0].getElementsByClassName('input_basic modified')[0].value=meta['album'];
    document.getElementsByClassName('item basic')[1].getElementsByClassName('datepicker input_basic hasDatepicker')[0].value=meta['date'];
    document.getElementsByClassName('item basic')[2].getElementsByClassName('input_basic')[0].value=meta['label'];
    document.getElementsByClassName('item basic')[3].getElementsByClassName('input_basic')[0].value=meta['numberOfDiscs'];
    document.getElementsByClassName('item basic')[4].getElementsByClassName('input_basic')[0].value=meta['isrc'];
    document.getElementsByClassName('item list')[0].getElementsByClassName('input_basic')[0].value=meta['albumAltName'];

    if (meta['artists']){  //TODO: more than 3 artists
        for (let i=0;i<Math.min(3,meta['artists'].length);i++){
            document.getElementsByClassName('item list musicians')[0].getElementsByClassName('input_basic')[i].value=meta['artists'][i];
        }
    }
    // items= // TODO
    fillDropdown(document.getElementsByClassName('dropdown')[0], // genre
                meta['genre'],
                {
                    'Blues': 0, 
                    'Classical': 1,
                    'EasyListening': 2, 
                    'Electronic': 3,
                    'Folk': 4, 
                    'FunkSoulRnB': 5,
                    'Jazz':6,
                    'Latin':7,
                    'Pop':8,
                    'Rap':9,
                    'Reggae': 10,
                    'Rock': 11,
                    'Soundtrack': 12,
                    'World': 13
                });
    fillDropdown(document.getElementsByClassName('dropdown')[1], // releaseType
                meta['releaseType'],
                {
                    'Album': 0, 
                    'Compilation': 1,
                    'EP': 2, 
                    'Single': 3,
                    'Bootleg': 4, 
                    'Video': 5
                });
    fillDropdown(document.getElementsByClassName('dropdown')[2], // media
                meta['media'],
                {
                    'CD': 0, 
                    'Digital': 1,
                    'Cassette': 2, 
                    'Vinyl': 3
                });
    document.getElementsByClassName('item text section')[0].getElementsByClassName('textarea_basic')[0].value= meta['tracks'];
    document.getElementsByClassName('item text section')[1].getElementsByClassName('textarea_basic')[0].value=meta['description'];

    if (click) document.getElementsByClassName('submit')[0].click();
}

// douban listing page 3
let fillDouban3=(meta,click=false) =>{ // TODO: auto-select image
    return null;
    
}



// ====== Bancamp/discogs/soundcloud/apple ======

let createButton = (currentPage)=>{
    var button=document.createElement("Button");
    button.innerHTML ="Collect";
    button.style = "top:0;left:0;position:absolute;z-index:9999";
    button.onclick=function(){
        let meta=collectMeta(currentPage);
        browser.runtime.sendMessage({page:currentPage,meta: JSON.stringify(meta)});
        window.open("https://music.douban.com/new_subject");
    };
    document.body.appendChild(button);
}

let formatDate=(dateStr)=>{
    try{
        let spl=dateStr.split(/ ?[, ] ?/);
        const monthNameMap={"jan":"01","feb":"02","mar":"03","apr":"04","may":"05","jun":"06","jul":"07","aug":"08","sep":"09","oct":"10","nov":"11","dec":"12","january":"01","february":"02","march":"03","april":"04","may":"05","june":"06","july":"07","august":"08","september":"09","october":"10","november":"11","december":"12"}
        let month="01", day="01", year='null';
        if (spl.length==1){
            year=dateStr;
        } else if (spl.length==2){
            month=spl[0];
            year=spl[1];
        } else if (spl.length==3){
            month=spl[0];
            day=spl[1]
            if (monthNameMap[String(day).toLowerCase()]){
                month=spl[1];
                day=spl[0];
            }
            year=spl[2];
            
        } else {return null;}
        
        month=month.padStart(2,'0').toLowerCase();
        if (monthNameMap[month]) month=monthNameMap[month];
        day=day.padStart(2,'0')
        return `${year}-${month}-${day}`;
    } catch(err){
        return null
    }
}

let collectMeta=(currentPage) => {
    switch (currentPage){
        case "bandcamp":
            return collectBandcampMeta();
        case "discogs":
            return collectDiscogsMeta();
        case "soundcloud":
           return collectSoundcloudMeta();
        case "apple":
            return collectAppleMeta();
        case "spotify":
            return collectSpotifyMeta();    
        default:
            return null
    }
}

let collectSpotifyMeta=() =>{
    out= {
        'url'           : document.URL,
        'album'         : document.getElementsByClassName('a12b67e576d73f97c44f1f37026223c4-scss')[0].textContent.trim(),
        'barcode'       : null,
        'albumAltName'  : null,
        'artists'       : [document.getElementsByClassName('_2b067c7a307d670c6b228bc3f783c022-scss')[0].textContent.trim()],
        'genre'         : 'Jazz',
        'releaseType'   : 'Album',  
        'media'         : 'Digital',  
        'date'          : document.getElementsByClassName("f6a6c11d18da1af699a0464367e2189a-scss")[0].textContent.trim(),
        'label'         : document.getElementsByClassName("ba7f7eeadfc8a4912c6f6c1b1a71e236")[0].children[0].textContent.trim().substring(6, ), 
        'numberOfDiscs' : null,
        'isrc'          : null,
        'tracks'        : Array.from(document.getElementsByClassName('da0bc4060bb1bdb4abb8e402916af32e-scss standalone-ellipsis-one-line _8a9c5cc886805907de5073b8ebc3acd8-scss')).map((ele) =>{
                            return ele.textContent.replaceAll(/[\n\t ]+/g,' ')
                        }).join('\n').trim(), 
                        
        'description'   : null,
        'imgUrl'        : document.getElementsByClassName('e606f708ec76d36e4cf363817b6b2ffd-scss').children[0].href
    }

    let tracks=document.getElementsByClassName('da0bc4060bb1bdb4abb8e402916af32e-scss standalone-ellipsis-one-line _8a9c5cc886805907de5073b8ebc3acd8-scss')
    let trackText="";
    for (let i=0;i< tracks.children.length;i++){
        let trackPos=(i+1).toString();

        let trackTitle=tracks[i].textContent.trim()

        trackText+=`${trackPos} - ${trackTitle} \n`
    }
    out['tracks']=trackText;

    return out;
}

let collectBandcampMeta=() =>{
    out= {
        'url'           : document.URL,
        'album'         : document.getElementById('name-section').children[0].textContent.trim(),
        'barcode'       : null,
        'albumAltName'  : null,
        'artists'       : [document.getElementById('name-section').children[1].getElementsByTagName('span')[0].textContent.trim()],
        'genre'         : 'Electronic',
        'releaseType'   : 'Album', // Not labeled on Bandcamp
        'media'         : 'Digital', // Not labeled on Bandcamp
        'date'          : document.getElementsByClassName("tralbumData tralbum-credits")[0].textContent.trim().split('\n')[0].replace('released ',''),
        'label'         : "Self-Released", // Bandcamp doesn't have a generic way for label
        'numberOfDiscs' : "1",
        'isrc'          : null,
        'tracks'        : Array.from(document.getElementById('track_table').children[0].children).map((ele) =>{
                            return ele.textContent.replaceAll(/[\n\t ]+/g,' ').replace(/ *buy track */,'')
                        }).join('\n').trim(), 
        'description'   : document.URL+"\n\n"+document.getElementsByClassName("tralbumData tralbum-about")[0].textContent.trim(),
        'imgUrl'        : document.getElementById('tralbumArt').children[0].href
    }
    out['date']=formatDate(out['date']);
    return out;
}

let collectDiscogsMeta=()=>{ // TODO
    out={}
    let keys=['url' ,'album','barcode','albumAltName' ,'artists','genre','releaseType'  ,'media','date','label','numberOfDiscs','isrc','tracks','description'  ,'imgUrl' ]
    for (const key of keys) out[key]=null;

    let profileBlock=document.getElementsByClassName('profile')[0]
    out['url']= document.URL
    out['album']= profileBlock.children[0].children[1].textContent.trim()
    out['artists']=Array.from(profileBlock.children[0].children[0].children).map((ele)=>{return ele.title.trim()})
    out['media']='Vinyl'; // default
    out['label']='Self-Released'; //default
    const keyRenameMap={'Genre': 'genre', 'Year': 'date', "Format":"media","Released":'date', 'Label': 'label'};
    const valueRenameMap={'Hip Hop':'Rap'}
    for (let i=1;i<profileBlock.children.length-1;i+=2){ //This handles genre, media, date, label
        let key=profileBlock.children[i].textContent.replace(":","").trim();
        let value=profileBlock.children[i+1].children[0].textContent.trim(); // TODO: multiple genres, multiple labels, etc
        
        key=keyRenameMap[key]
        if (key){
            
            if (valueRenameMap[value]) value=valueRenameMap[value];
            out[key]=value;
        }
    }
    if (out['date']) out['date']=formatDate(out['date']);
    out['releaseType']='Album';
    out['numberOfDiscs']=1;
    // tracks

    let tracks=document.getElementById('tracklist').getElementsByTagName('tbody')[0]
    let trackText="";
    for (let i=0;i< tracks.children.length;i++){
        let track=tracks.children[i]
        let trackPos=(i+1).toString();
        let es=track.getElementsByClassName("tracklist_track_pos")
        if (es.length>0) trackPos=es[0].textContent.trim();
        let trackTitle=''
        es=track.getElementsByClassName("tracklist_track_title")
        if (es.length>0) trackTitle=es[0].textContent.trim();
        let trackDur=''
        es=track.getElementsByClassName("tracklist_track_duration")
        if (es.length>0) trackDur=es[0].textContent.trim();
        trackText+=`${trackPos} - ${trackTitle} ${trackDur}\n`
    }
    out['tracks']=trackText;

    out['description']=out['url']
    let noteBlock=document.getElementById('notes');
    if (noteBlock) out['description']+='\n\n'+noteBlock.children[1].textContent.trim();

    out['imgUrl']=JSON.parse(document.getElementById('page_content').getElementsByClassName("image_gallery")[0].attributes['data-images'].nodeValue)[0]['full'];

    return out;
}


let collectSoundcloudMeta=()=>{ // TODO
    return null
}

let collectAppleMeta=()=>{ // TODO
    out={}
    let keys=['url' ,'album','barcode','albumAltName' ,'artists','genre','releaseType'  ,'media','date','label','numberOfDiscs','isrc','tracks','description'  ,'imgUrl' ]
    for (const key of keys) out[key]=null;

    out['url']= document.URL;
    out['album']=document.getElementsByClassName('album-header-metadata')[0].children[0].textContent.trim();
    out['barcode']=null;
    out['artists']=[document.getElementsByClassName('album-header-metadata')[0].children[1].textContent.trim()];
    let genre=document.getElementsByClassName('album-header-metadata')[0].children[2].textContent.trim().split("·")[0].trim();
    const genreNameMap={'Dance':'Electronic','Hip-Hop':'Rap','HipHop':'Rap','Alternative':'Rock', "Hip-Hop/Rap":'Rap'};
    if (genre && genreNameMap[genre]) out['genre']=genreNameMap[genre];
    out['releaseType']='Album'; // TODO
    out['media']='Digital';
    out['date']=document.getElementsByClassName("bottom-metadata")[0].getElementsByClassName('song-released-container')[0].textContent.replace("RELEASED",'').trim() // TODO:convert
    out['date']=formatDate(out['date']);
    try{
        out['label']=document.getElementsByClassName("bottom-metadata")[0].getElementsByClassName('song-copyright')[0].textContent.replace(/℗ \d+ /,'');
    } catch (err){}
    out['numberOfDiscs']="1";

    // tracks
    let tracksText="";
    let songs=document.getElementsByClassName("songs-list")[0].getElementsByClassName('song-name');
    for (i=0;i<songs.length;i++){
        tracksText+=`${i+1}. ${songs[i].textContent.trim()}\n`;
    } 
    out['tracks']=tracksText

    out['description']=out['url']
    try{
        out['description']='\n\n'+document.getElementsByClassName('product-page-header')[0].getElementsByClassName('truncated-content-container')[0].textContent.replace(/Editors’ Notes/,'').trim()
    } catch(err){}

    try{
        let _arr=document.getElementsByClassName('product-info')[0].getElementsByTagName('source')[1].srcset.split(" ");
        out['imgUrl']=_arr[_arr.length-2];
    } catch(err){}
    return out;
}


// ====== Testing ======

let _metaTest={
    'album'         :'album'         ,
    'barcode'       : null           , //"727361514624"
    'albumAltName'  :'albumAltName'  ,
    'artists'       :['artist']       ,
    'genre'         :'genre'         ,
    'releaseType'   :'releaseType'   ,
    'media'         :'media'         ,
    'date'          :'date'          ,
    'label'         :'label'         ,
    'numOfDiscs'    :'numOfDiscs'    ,
    'isrc'          :'isrc'          ,
    'tracks'        :'tracks'        ,
    'description'   :'description'   
}

// console.log("Testing plugin");
// console.log(getCurrentPage());


// ====== Main ======

//let meta=_metaTest;
let currentPage=getCurrentPage();

// Default action: add buttons to bandcamp/discogs/soundcloud/apple pages
switch(currentPage){
    case 'bandcamp':
    case 'discogs':
    case 'apple':
    // case 'soundcloud':
        createButton(currentPage);
    case 'douban-1':
    case 'douban-2':
    case 'douban-3':
        browser.runtime.sendMessage({page:currentPage});
        break;
}

// listens to background script message
// only get message on douban-1 opened by the bandcamp button
browser.runtime.onMessage.addListener(message => {
    console.log("Message from the background script:");
    if (message.meta){
        let metaBackground=JSON.parse(message.meta)
        if(currentPage=='douban-1'){
            fillDouban1(metaBackground,click=true);
            localStorage.setItem(localStorageId, JSON.stringify(metaBackground));
        }
    }

});

// autofill douban-2 if meta is stored to localStorage
let metaStored=localStorage.getItem(localStorageId)
if (metaStored){
    metaStored=JSON.parse(metaStored);
    if (currentPage=='douban-2'){
        fillDouban2(metaStored,click=false);
    }
    localStorage.removeItem(localStorageId);
}

console.log('content script ends');
