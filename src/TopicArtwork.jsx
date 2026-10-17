import React from 'react';
import {artUrl,referenceArt} from './ReferenceArt.jsx';
import {artworkConnections} from './referenceArtwork.js';
export default function TopicArtwork({id}){
 const art=referenceArt[id];
 return <figure className="reference-topic-art"><img className="reference-topic-image" src={artUrl(id)} alt={art.alt} width="1536" height="1024" loading="lazy" decoding="async"/><figcaption><details><summary>این تصویر چه ربطی به موضوع دارد؟</summary><p>{artworkConnections[id]}</p></details></figcaption></figure>;
}
