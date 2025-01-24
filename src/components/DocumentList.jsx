import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfiguration";

const DocumentList = () => {
  const [ideas, setIdeas] = useState([]);
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async (allIdeas) => {
    try {
      const mainCollection = collection(db, "Ideas");
      const mainDocs = await getDocs(mainCollection);

      if (mainDocs.empty) {
        console.log("No documents found in the Ideas collection.");
        return;
      }

      console.log("Found documents in Ideas collection:");
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
    } catch (error) {
      console.error("Error fetching ideas:", error);
    }
  };

  const fetchByUsername = async (allIdeas) => {
    try {
      const userCollection = collection(db, "users");
      const userDocs = await getDocs(userCollection);

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

          allIdeas.push({
            parentEmail: `${userName} - ${userEmail}`,
            ideaDocId: ideaDoc.id,
            ...ideaDoc.data(),
          });
        });
      }
    } catch (error) {
      console.error("Error fetching ideas by username:", error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const allIdeas = [];
      await fetchData(allIdeas);
      await fetchByUsername(allIdeas);
      // Ensure uniqueness
      const uniqueIdeas = Array.from(
        new Map(allIdeas.map((item) => [`${item.parentEmail}-${item.ideaDocId}`, item])).values()
      );
      setIdeas(uniqueIdeas);
      setFilteredIdeas(uniqueIdeas); // Set filtered ideas as well
      setLoading(false);
    };

    fetchAllData();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = ideas.filter(
      (idea) =>
        idea.parentEmail.toLowerCase().includes(value) ||
        (idea.teamName && idea.teamName.toLowerCase().includes(value)) ||
        (idea.ideaDescription && idea.ideaDescription.toLowerCase().includes(value))
    );
    setFilteredIdeas(filtered);
  };

  if (loading) {
    return <p style={{ textAlign: "center", fontSize: "1.2em", color: "#555" }}>Loading ideas...</p>;
  }

  // Calculate total ideas and unique users
  const totalIdeas = filteredIdeas.length;
  const uniqueUsers = new Set(filteredIdeas.map((idea) => idea.parentEmail)).size;

  return (
    <div style={{ padding: "20px", backgroundColor: "#f4f4f9" }}>
      <h2 style={{ textAlign: "center", color: "#333", fontFamily: "'Arial', sans-serif" }}>Idea Details</h2>

      {/* Dashboard Summary */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Total Ideas Card */}
        <div
          style={{
            backgroundColor: "rgba(76, 175, 80, 0.8)",  // Green with transparency
            color: "#fff",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            width: "250px",  // Adjusted size
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <h3>Total Ideas</h3>
          <p style={{ fontSize: "2.5em", fontWeight: "bold" }}>{totalIdeas}</p>
        </div>

        {/* Unique Users Card */}
        <div
          style={{
            backgroundColor: "rgba(255, 152, 0, 0.8)",  // Orange with transparency
            color: "#fff",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            width: "250px",  // Adjusted size
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <h3>Unique Users</h3>
          <p style={{ fontSize: "2.5em", fontWeight: "bold" }}>{uniqueUsers}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <input
          type="text"
          placeholder="Search by email, team name, or description..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            padding: "8px",
            width: "300px",
            fontSize: "1em",
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginBottom: "20px",
          }}
        />
      </div>

      {filteredIdeas.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888" }}>No ideas available.</p>
      ) : (
        <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#4CAF50", color: "#fff" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Parent Email</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Idea Document ID</th>
              <th style={{ padding: "10px", textAlign: "left" }}>User Email</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Team Name</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Category</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Description</th>
              <th style={{ padding: "10px", textAlign: "left" }}>College</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Contact</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Department</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Year</th>
            </tr>
          </thead>
          <tbody>
            {filteredIdeas.map((idea, index) => (
              <tr
                key={`${idea.parentEmail}-${idea.ideaDocId}-${index}`}
                style={{
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#e9ecef",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#d1f7d8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "#e9ecef";
                }}
              >
                <td style={{ padding: "10px" }}>{idea.parentEmail}</td>
                <td style={{ padding: "10px" }}>{idea.ideaDocId}</td>
                <td style={{ padding: "10px" }}>{idea.userEmail || "N/A"}</td>
                <td style={{ padding: "10px" }}>{idea.teamName || "N/A"}</td>
                <td style={{ padding: "10px" }}>{idea.categoryChecked || "N/A"}</td>
                <td style={{ padding: "10px" }}>
                  <div
                    style={{
                      maxHeight: "3em",
                      overflowY: idea.ideaDescription && idea.ideaDescription.length > 20 ? "auto" : "visible",
                      lineHeight: "1.5em",
                      whiteSpace: "normal",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {idea.ideaDescription || "N/A"}
                  </div>
                </td>
                <td style={{ padding: "10px" }}>{idea.college || "N/A"}</td>
                <td style={{ padding: "10px" }}>{idea.contactNumber || "N/A"}</td>
                <td style={{ padding: "10px" }}>{idea.department || "N/A"}</td>
                <td style={{ padding: "10px" }}>{idea.year || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DocumentList;
