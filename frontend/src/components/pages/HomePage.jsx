import React, { useRef } from 'react';
import Banner from './Banner';
import PostList from '../Common/PostList';

function Homepage() {
  const postListRef = useRef(null); 

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Banner scrollToPosts={() => postListRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      <div ref={postListRef}>
        <PostList />
      </div>
    </div>
  );
}

export default Homepage;
