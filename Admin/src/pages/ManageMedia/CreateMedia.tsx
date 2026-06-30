import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import TagsInput from "../../component/TagsInput/TagsInput";
import { createMediaApi } from "../../api/media.api";
import toast from "react-hot-toast";

const CreateMedia = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!titleAr.trim()) newErrors.titleAr = "Arabic title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!descriptionAr.trim()) newErrors.descriptionAr = "Arabic description is required";
    if (!file) newErrors.file = "Media file is required";
    if (tags.length === 0) newErrors.tags = "At least one tag is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setFilePreview(URL.createObjectURL(f));
      setErrors(prev => {
        const { file: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const loadingToast = toast.loading("Creating media...");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("title_ar", titleAr.trim());
      formData.append("description", description.trim());
      formData.append("description_ar", descriptionAr.trim());
      formData.append("tags", JSON.stringify(tags));
      if (file) formData.append("file", file);
      await createMediaApi(formData);
      toast.success("Media created successfully", { id: loadingToast });
      navigate("/cms/media");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/cms/media" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to Media</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-secondary">Add Media</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label="Title (English)"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
            />
            <InputField
              label="Title (Arabic)"
              placeholder="Enter Arabic title"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              error={errors.titleAr}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label="Description (English)"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              required
            />
            <InputField
              label="Description (Arabic)"
              placeholder="Enter Arabic description"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              error={errors.descriptionAr}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">Tags</label>
            <TagsInput
              value={tags}
              onChange={setTags}
              placeholder="Type tag and press Enter"
              error={errors.tags}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">Media File *</label>
            <div className="relative border-2 border-dashed border-[#364B9B66] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.mp4,.pdf,.docx,.pptx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {filePreview ? (
                <div className="relative group pointer-events-none">
                  {file?.type.startsWith("video/") ? (
                    <video src={filePreview} className="w-32 h-24 rounded-lg object-cover border" muted />
                  ) : file?.type.startsWith("image/") ? (
                    <img src={filePreview} alt="Preview" className="w-32 h-24 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-32 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500 font-medium border">
                      {file?.name.split('.').pop()?.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs pointer-events-none">
                    Change
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <svg className="w-8 h-8 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-secondary">Click to upload file</span>
                  <span className="text-[10px] text-secondary/50">Images: JPG, PNG  |  Media: MP4  |  Documents: PDF, DOCX, PPTX (not PPT)</span>
                </div>
              )}
            </div>
            {errors.file && <p className="text-red-500 text-xs">{errors.file}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              to="/cms/media"
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              Cancel
            </Link>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMedia;
