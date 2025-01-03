import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfiguration";

const DocumentList = () => {
  const [ideas, setIdeas] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const mainCollection = collection(db, "Ideas");
      const mainDocs = await getDocs(mainCollection);

      if (mainDocs.empty) {
        console.log("No documents found in the Ideas collection.");
        return;
      }

      console.log("Found documents in Ideas collection:");
      const allIdeas = [];

      for (const emailDoc of mainDocs.docs) {
        console.log(`Processing Document ID: ${emailDoc.id}`);
        console.log("Document Data:", emailDoc.data());

        const ideaDetailsCollection = collection(emailDoc.ref, "IdeaDetais"); 
        const ideaDetailsSnap = await getDocs(ideaDetailsCollection);

        if (ideaDetailsSnap.empty) {
          console.log(`No documents in IdeaDetails subcollection for ${emailDoc.id}`);
        } else {
          ideaDetailsSnap.forEach((ideaDoc) => {
            console.log(`Subcollection Document ID: ${ideaDoc.id}`);
            console.log("Subcollection Document Data:", ideaDoc.data());

            allIdeas.push({
              parentEmail: emailDoc.id, 
              ideaDocId: ideaDoc.id,
              ...ideaDoc.data(), 
            });
          });
        }
      }

      setIdeas((prevIdeas) => [...prevIdeas, ...allIdeas]); 
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchByUsername = async () => {
    try {
      const userCollection = collection(db, "users");
      const userDocs = await getDocs(userCollection);

      const ideasByUsername = [];

      for (const userDoc of userDocs.docs) {
        const userName = userDoc.data().userName;
        const userEmail = userDoc.data().userEmail;

        const mainCollection = collection(
          db,
          `Ideas/${userName} - ${userEmail}/IdeaDetais`
        );
        const mainDocs = await getDocs(mainCollection);

        mainDocs.forEach((ideaDoc) => {
          console.log(`Subcollection Document ID: ${ideaDoc.id}`);
          console.log("Subcollection Document Data:", ideaDoc.data());

          ideasByUsername.push({
            parentEmail: `${userName} - ${userEmail}`,
            ideaDocId: ideaDoc.id,
            ...ideaDoc.data(),
          });
        });
      }
      console.log(ideasByUsername.length)
      setIdeas((prevIdeas) => [...prevIdeas, ...ideasByUsername]);
    } catch (error) {
      console.error("Error fetching ideas by username:", error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await fetchData();
      await fetchByUsername();
      setLoading(false);
    };

    fetchAllData();
  }, []);

  if (loading) {
    return <p>Loading ideas...</p>;
  }

  return (
    <div>
      <h2>Idea Details</h2>
      {ideas.length === 0 ? (
        <p>No ideas available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Parent Email</th>
              <th>Idea Document ID</th>
              <th>User Email</th>
              <th>Team Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>College</th>
              <th>Contact</th>
              <th>Department</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
  {ideas.map((idea, index) => (
    <tr key={`${idea.parentEmail}-${idea.ideaDocId}-${index}`}>
      <td>{idea.parentEmail}</td>
      <td>{idea.ideaDocId}</td>
      <td>{idea.userEmail || "N/A"}</td>
      <td>{idea.teamName || "N/A"}</td>
      <td>{idea.categoryChecked || "N/A"}</td>
      <td>{idea.ideaDescription || "N/A"}</td>
      <td>{idea.college || "N/A"}</td>
      <td>{idea.contactNumber || "N/A"}</td>
      <td>{idea.department || "N/A"}</td>
      <td>{idea.year || "N/A"}</td>
    </tr>
  ))}
</tbody>

        </table>
      )}
    </div>
  );
};

export default DocumentList;
