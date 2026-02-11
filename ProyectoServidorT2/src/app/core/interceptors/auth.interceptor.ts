export const authInterceptor = (req: Request, next: (req: Request) => Promise<Response>): Promise<Response> => {
    const token = localStorage.getItem('token')
    if (token) {
        const modifiedReq = new Request(req, {
            headers: new Headers({
                ...Object.fromEntries(req.headers.entries()),
                'Authorization': `Bearer ${token}`
            })
        })
        return next(modifiedReq)
    }
    return next(req)
}