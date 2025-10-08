import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const MessageDetail = () => {
  const { id } = useParams();
  const [message, setMessage] = useState(null);
  const [assignee, setAssignee] = useState(null);
  const [supportUsers, setSupportUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [conclusion, setConclusion] = useState('');
  const [isConclusionProvided, setIsConclusionProvided] = useState(false);
  const [version, setVersion] = useState(0); // For optimistic locking
  const [comments, setComments] = useState([]); // New State for Comments
  const [newComment, setNewComment] = useState(''); // New Comment Input
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null); // Track comment being edited
  const [editCommentText, setEditCommentText] = useState(''); // Store edit text  
  const query = 'query';
  const userRole = localStorage.getItem('role');
  const useremail = localStorage.getItem('useremail');
  const userName = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');
  const secretKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await axios.get(
          `${secretKey}/admin/retrieveQuery/${id}`,
        );
        setMessage(response.data);
        setAssignee(response.data.assignedUser || null);
        setStatus(response.data.status || 'Open');
        setVersion(response.data.version || 0);
      } catch (error) {
        console.error('Error fetching message:', error);
      }
    };

    const fetchSupportUsers = async () => {
      try {
        const response = await axios.get(`${secretKey}/admin/getSupportUsers`);
        setSupportUsers(response.data);
      } catch (error) {
        console.error('Error fetching support users:', error);
      }
    };
    const fetchComments = async () => {
      try {
        const response = await axios.get(`${secretKey}/admin/getComments/${id}`, {
          params: { tag: query }, // Ensure 'tag' is passed via query parameters
        });
        setComments(response.data || []);
      } catch (error) {
        console.error('Error fetching support users:', error);
      }
    };
    fetchComments();
    fetchMessage();
    fetchSupportUsers();
  }, [id]);
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsCommentSaving(true);
    try {
      const response = await axios.post(`${secretKey}/admin/addComments/${id}`, {
        comment: newComment,
        tag:query,
        userId,
        userName,
        role: userRole
      });
      setComments([...comments, response.data]); // Add new comment to state
      setNewComment(''); // Clear input
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommentSaving(false);
    }
  };
  const handleStatusChange = async () => {
    if (status === 'End' && !conclusion) {
      setShowPopup(true); // Show popup if conclusion is missing
      return; // Exit the function so that no status is saved
    }

    setIsStatusSaving(true);
    let finalStatus = status;

    // Automatically change status to 'Completed' if conditions are met
    if (status === 'End' && conclusion) {
      finalStatus = 'Completed';
    }

    try {
      await axios.post( `${secretKey}/admin/updateStatus/${id}`, {
        status: finalStatus,
        conclusion: conclusion,
        conclusionTime:
          finalStatus === 'Completed' ? new Date().toISOString() : null,
      });
      setStatus(finalStatus); // Update the status state
    } catch (error) {
      console.error('Error saving status:', error);
    } finally {
      setIsStatusSaving(false);
    }
  };
  const handleEditComment = (comment) => {
    if (comment.userId !== userId) return; // Only allow the current user to edit their own comment
    setEditingCommentId(comment.id);
    setEditCommentText(comment.comment);
  };
  
  const handleSaveEditedComment = async () => {
    try {
      const response = await axios.put(
        `${secretKey}/admin/editComment/${editingCommentId}`, 
        { comment: editCommentText, edited: true }
      );
      setComments(comments.map(c => 
        c.id === editingCommentId ? { ...c, comment: editCommentText, edited: true } : c
      ));
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };
  const handleAssigneeChange = async () => {
    setIsSaving(true);
    try {
      const response = await axios.post(
        `${secretKey}/admin/updateAssignee/${id}`,
        {
          assigneeId: selectedAssignee,
          version,
        },
      );

      if (response.data.success) {
        setAssignee(
          supportUsers.find((user) => user.id === parseInt(selectedAssignee)),
        );
        setVersion(response.data.version); // Update the version from backend
      } 
    } catch (error) {
      console.error('Error updating assignee:', error);
    } finally {
      setIsSaving(false);
    }
  };



  const handleConclusionChange = (e) => {
    setConclusion(e.target.value);
    setIsConclusionProvided(e.target.value.trim() !== '');
  };

  if (!message) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-270 p-4">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark relative">
        {/* Top Bar with Back Button */}
        <div className="border-b border-stroke py-4 px-7 dark:border-strokedark flex justify-between items-center">
          <h3 className="font-medium text-black dark:text-white">
            Message Details
          </h3>
        </div>

        {/* Status and Assignee Section */}
        <div className="flex items-center justify-end gap-4 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-white">
            Status:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={
              isStatusSaving ||
              (userRole !== 'SuperAdmin' &&
                (status === 'Completed' || useremail !== assignee?.email))
            }
            className="p-2 border border-gray-300 dark:bg-boxdark dark:text-white dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Open">🟢 Open</option>
            <option value="inProgress">🟡 In Progress</option>
            <option value="End">🔴 End</option>
            <option value="Completed" style={{ display: 'none' }}>
              ✅ Completed
            </option>
          </select>

          <button
            onClick={handleStatusChange}
            disabled={
              isStatusSaving ||
              (!status && !isConclusionProvided) ||
              (userRole !== 'SuperAdmin' &&
                (status === 'Completed' || useremail !== assignee?.email))
            }
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            {isStatusSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Details Section */}
        <div className="p-7">
          <div className="mb-5.5">
            <label className="mb-3 block text-lg font-medium text-black dark:text-white">
              User ID
            </label>
            <p className="text-sm text-black dark:text-white">
              {message.queryDetails?.userId}
            </p>
          </div>
          <div className="mb-5.5">
            <label className="mb-3 block text-lg font-medium text-black dark:text-white">
              Full Name
            </label>
            <p className="text-sm text-black dark:text-white">
              {message.queryDetails?.fullname}
            </p>
          </div>
          <div className="mb-5.5">
            <label className="mb-3 block text-lg font-medium text-black dark:text-white">
              Email
            </label>
            <p className="text-sm text-black dark:text-white">
              {message.queryDetails?.email}
            </p>
          </div>
          <div className="mb-5.5">
            <label className="mb-3 block text-lg font-medium text-black dark:text-white">
              Phone
            </label>
            <p className="text-sm text-black dark:text-white">
              {message.queryDetails?.phone}
            </p>
          </div>
          <div className="mb-5.5">
            <label className="mb-3 block text-lg font-medium text-black dark:text-white">
              Message
            </label>
            <p className="text-sm text-black dark:text-white">
              {message.queryDetails?.message}
            </p>
          </div>
          <div className="mb-5.5">
            <label className="mb-3 block text-lg font-medium text-black dark:text-white">
              Assigned Support
            </label>
            <p className="text-sm text-black dark:text-white">
              {assignee ? assignee.name : 'Not Assigned'}
            </p>
            {userRole === 'SuperAdmin' && (
        <>
        <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="p-2 mt-2 mr-3 border rounded dark:bg-boxdark text-black dark:text-white"
                >
                  <option className="text-black dark:text-white" value="">
                    Select Support User
                  </option>
                  {supportUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssigneeChange}
                  disabled={isSaving || !selectedAssignee}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
          </>
        )}
            {userRole === 'Support' && !assignee && (
              <>
                <label className="flex items-center p-2 mt-2">
                  <input
                    type="checkbox"
                    checked={selectedAssignee === userId}
                    onChange={(e) =>
                      setSelectedAssignee(e.target.checked ? userId : '')
                    }
                    disabled={assignee} // Disable if already assigned
                    className="mr-2"
                  />
                  <span className="text-black dark:text-white">
                    <b>Assign it to me</b>
                  </span>
                </label>
                <button
                  onClick={handleAssigneeChange}
                  disabled={
                    isSaving || !selectedAssignee || assignee // Disable if already assigned
                  }
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            <div className="mt-6 p-4 rounded-md bg-gray-50 dark:bg-boxdark">
  <h4 className="font-medium mb-2 text-lg">Activity</h4>

  {/* Comments List */}
  <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-strokedark dark:scrollbar-track-boxdark bg-white dark:bg-boxdark rounded-md ">
    {comments.length > 0 ? (
      comments.map((comment) => (
        <div
          key={comment.id}
          className="p-2 border-b last:border-0 border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm md:text-base">
            <strong>{comment.userName}</strong> ({comment.role}) -{' '}
            <span className="text-xs md:text-sm text-gray-500">
              {comment.Timestamp
                ? new Date(comment.Timestamp).toLocaleString()
                : ''}
            </span>
          </p>
          <p className="text-sm md:text-base">{comment.comment}</p>
        </div>
      ))
    ) : (
      <p className="text-center text-sm text-gray-500">No comments yet.</p>
    )}
  </div>

  {/* Add Comment Form */}
  <div className="mt-4 flex flex-col md:flex-row gap-2">
    <input
      type="text"
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      placeholder="Add a comment..."
      className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-boxdark focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      onClick={handleAddComment}
      disabled={isCommentSaving}
      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:bg-blue-300"
    >
      {isCommentSaving ? 'Adding...' : 'Add Comment'}
    </button>
  </div>
</div>

      {/* Back Button */}
      <div className="mt-4">
      <Link
                to="/queryTable"
                className="rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              >
                Back
              </Link>
      </div>
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-10">
          <div className="bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-black">
              Conclusion Required
            </h3>
            <textarea
              value={conclusion}
              onChange={handleConclusionChange}
              placeholder="Enter conclusion for the query"
              className="mt-3 p-2 border rounded-md w-full"
            />
            <div className="mt-3 flex justify-end gap-4">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!isConclusionProvided}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Save Conclusion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDetail;
